const CATEGORY_SCENES: Record<string, string> = {
  health:
    "serene morning landscape with dew-covered grass, soft mist rising, and gentle natural light",
  fitness:
    "mountain trail at dawn with athletic energy tempered by calm, rocky terrain and open sky",
  reading:
    "warm study nook with stacked leather-bound books, soft lamplight, and a worn wooden desk",
  mindfulness:
    "zen garden with raked sand patterns, smooth stones, and still water reflecting soft light",
  productivity:
    "clean workspace bathed in natural morning light, minimal objects, open notebook",
  nutrition:
    "rustic kitchen counter with fresh produce, warm tones, ceramic bowls, natural textures",
  sleep:
    "moonlit bedroom scene with soft linen, dim warm glow, and deep calm atmosphere",
  creativity:
    "artist's workbench with scattered natural pigments, brushes, and a half-finished canvas in golden light",
  social:
    "cozy gathering space with warm ambient lighting, soft textures, and an inviting atmosphere",
  finance:
    "organized study with leather-bound ledgers, brass accents, and deliberate morning light",
};

const BUCKET_LIGHTING: Record<string, string> = {
  MORNING: "warm sunrise rim light, fresh and energizing, soft golden hour",
  DAY: "bright natural daylight, crisp and clear, open and productive",
  EVENING:
    "warm amber sunset tones, reflective and winding down, long shadows",
  BEFORE_BED:
    "dim candlelight warmth, deeply calm, restful dark tones with soft glow",
};

function getSceneForCategory(categoryName: string): string {
  const key = categoryName.toLowerCase().trim();
  for (const [cat, scene] of Object.entries(CATEGORY_SCENES)) {
    if (key.includes(cat) || cat.includes(key)) return scene;
  }
  return "abstract natural environment with layered hills, textured atmosphere, and contemplative depth";
}

interface HabitPromptParams {
  name: string;
  categoryName: string;
  description?: string | null;
  trackingType: string;
}

export function generateHabitImagePrompt({
  name,
  categoryName,
  description,
  trackingType,
}: HabitPromptParams): string {
  const scene = getSceneForCategory(categoryName);
  const subjectHint =
    trackingType === "COUNT"
      ? `symbolic of measurable progress (e.g. stacked objects, a filling vessel, tally marks in nature)`
      : `symbolic of a single intentional action or ritual completion`;
  const descLine = description
    ? `\nContext from user: "${description}" — weave this theme subtly into the scene.`
    : "";

  return `Use case: habit-card-background
Asset type: personal habit artwork for "${name}"
Primary request: Create a cinematic editorial illustration representing the habit "${name}" in the ${categoryName} category.${descLine}
Scene/backdrop: ${scene}.
Subject: ${subjectHint}. Keep the subject minimal and symbolic — no busy character scenes.
Style/medium: premium editorial digital painting with painterly realism, textured and atmospheric.
Composition/framing: landscape 16:9, strong negative space for UI overlays (text will sit over this image with a dark gradient scrim). Subject weighted to one side.
Lighting/mood: contemplative, grounded, quietly motivating.
Color palette: forest green, parchment cream, brushed gold, soft charcoal — avoid saturated or neon colors.
Constraints: no text, no logos, no watermarks, no UI elements in the image. Image will be dimmed and used as a card background.
Avoid: cluttered scenes, high-action poses, fantasy/sci-fi elements, stock photo look, bright competing focal points.`;
}

interface TaskPromptParams {
  name: string;
  description?: string | null;
  frequency: string;
  bucket?: string | null;
}

export function generateTaskImagePrompt({
  name,
  description,
  frequency,
  bucket,
}: TaskPromptParams): string {
  const lighting = BUCKET_LIGHTING[bucket ?? "DAY"] ?? BUCKET_LIGHTING.DAY;
  const rhythmHint =
    frequency === "DAILY"
      ? "daily rhythm — steady, reliable, ever-present"
      : frequency === "WEEKLY"
        ? "weekly cadence — spaced and intentional, a recurring anchor"
        : frequency === "MONTHLY"
          ? "monthly milestone — deliberate, substantial, marking time"
          : "recurring rhythm — structured spacing, balanced pacing";
  const descLine = description
    ? `\nContext from user: "${description}" — weave this theme subtly into the scene.`
    : "";

  return `Use case: task-card-background
Asset type: personal task artwork for "${name}"
Primary request: Create a calm editorial illustration representing the recurring task "${name}" with a sense of ${rhythmHint}.${descLine}
Scene/backdrop: abstract natural environment suggesting steady rhythm — stepping stones, rippling water, or repeating natural patterns. Gentle depth layers.
Subject: minimal symbolic objects (ribbon, twine, leaf, stone) suggesting spacing and cadence — not literal app UI or task lists.
Style/medium: refined textured illustration with subtle grain, soft gradients, premium wellness aesthetic.
Composition/framing: landscape 16:9, directional flow, clear breathing room for UI overlays with dark gradient scrim.
Lighting/mood: ${lighting}.
Color palette: evergreen, mist grey, warm gold highlights, muted teal as secondary accent sparingly.
Constraints: no text, no icons, no watermarks, no UI elements. Image will be dimmed and used as a card background.
Avoid: clip-art, neon colors, chaotic scatter, stock photo look, harsh contrast.`;
}
