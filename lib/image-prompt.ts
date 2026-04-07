interface CategoryTheme {
  scenes: string[];
  motifs: string[];
  palettes: string[];
  mood: string;
}

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  health: {
    scenes: [
      "serene morning meadow with dew-covered grass and gentle mist",
      "quiet forest path with filtered sunbeams and clean air",
      "calm lakeside at first light with subtle ripples",
    ],
    motifs: ["leaf arc", "water ripple", "balanced stone stack"],
    palettes: [
      "sage green, mist silver, warm cream",
      "moss green, pale sky blue, soft gold",
    ],
    mood: "restorative and grounded",
  },
  fitness: {
    scenes: [
      "mountain trail at dawn with sweeping horizon",
      "open training field with long morning shadows",
      "coastal cliff path with wind and clear depth",
    ],
    motifs: ["ascending path", "rope texture", "stacked marker stones"],
    palettes: [
      "deep pine, slate grey, sunrise amber",
      "charcoal, muted teal, brushed brass",
    ],
    mood: "energetic but disciplined",
  },
  reading: {
    scenes: [
      "warm study nook with old books and soft lamplight",
      "quiet library corner with natural oak textures",
      "window-side reading chair with rain-softened daylight",
    ],
    motifs: ["turned page arc", "ink line", "book spine rhythm"],
    palettes: [
      "walnut brown, parchment cream, muted olive",
      "sepia, dusty blue, antique gold",
    ],
    mood: "reflective and focused",
  },
  mindfulness: {
    scenes: [
      "zen garden with raked sand and still water",
      "minimal stone courtyard with morning fog",
      "quiet bamboo grove with soft diffuse light",
    ],
    motifs: ["ensō-like circle", "smooth pebble path", "soft water ring"],
    palettes: [
      "stone grey, sage, warm ivory",
      "mist blue, sand beige, charcoal",
    ],
    mood: "still and contemplative",
  },
  productivity: {
    scenes: [
      "clean workspace with notebook and precise object placement",
      "sunlit desk with subtle geometric shadows",
      "organized studio table with minimal tools",
    ],
    motifs: ["grid rhythm", "aligned paper edge", "single directional line"],
    palettes: [
      "evergreen, warm parchment, graphite",
      "olive, muted cream, antique brass",
    ],
    mood: "clear and intentional",
  },
  nutrition: {
    scenes: [
      "rustic kitchen counter with fresh produce and ceramic bowls",
      "farmers market table with natural fibers and herbs",
      "sunlit pantry shelf with simple wholesome ingredients",
    ],
    motifs: ["seed scatter", "herb bundle", "ceramic curve"],
    palettes: [
      "leaf green, terracotta, oat cream",
      "olive, warm clay, muted gold",
    ],
    mood: "nourishing and earthy",
  },
  sleep: {
    scenes: [
      "moonlit bedroom with soft linen and dim warm glow",
      "quiet night window with drifting clouds",
      "minimal bedside scene with diffused lamp light",
    ],
    motifs: ["crescent arc", "soft fabric folds", "slow gradient glow"],
    palettes: [
      "midnight blue, warm taupe, dim amber",
      "indigo, smoke grey, muted gold",
    ],
    mood: "deeply calm and soothing",
  },
  creativity: {
    scenes: [
      "artist workbench with pigments and textured papers",
      "studio wall with layered sketches and soft shadows",
      "craft table with hand tools and subtle color traces",
    ],
    motifs: ["brush stroke sweep", "pigment bloom", "collage-like layering"],
    palettes: ["forest green, ochre, charcoal", "teal, rust, parchment"],
    mood: "playful yet composed",
  },
  social: {
    scenes: [
      "cozy gathering space with warm ambient lighting",
      "shared table setting with natural materials",
      "fireside lounge with soft layered textiles",
    ],
    motifs: [
      "interlocking circles",
      "woven texture",
      "paired object silhouettes",
    ],
    palettes: ["warm amber, olive, soft brown", "muted coral, sage, parchment"],
    mood: "welcoming and connected",
  },
  finance: {
    scenes: [
      "organized study with ledgers and brass accents",
      "clean desk with notebook, ruler, and subtle symmetry",
      "quiet planning table with measured visual rhythm",
    ],
    motifs: ["stacked lines", "measured intervals", "balanced columns"],
    palettes: ["deep green, brass, parchment", "charcoal, olive, warm cream"],
    mood: "stable and deliberate",
  },
};

const BUCKET_LIGHTING: Record<string, string> = {
  MORNING: "warm sunrise rim light, fresh and energizing, soft golden hour",
  DAY: "bright natural daylight, crisp and clear, open and productive",
  EVENING: "warm amber sunset tones, reflective and winding down, long shadows",
  BEFORE_BED:
    "dim candlelight warmth, deeply calm, restful dark tones with soft glow",
};

const TASK_BUCKET_THEMES: Record<string, CategoryTheme> = {
  MORNING: {
    scenes: [
      "sunrise desk by a window with fresh air and clean lines",
      "early morning trail overlook with first light on horizon",
      "quiet kitchen setup with gentle dawn glow",
    ],
    motifs: ["rising arc", "first-light gradient", "small forward marker"],
    palettes: ["soft gold, mist blue, sage", "warm amber, cool grey, olive"],
    mood: "fresh, optimistic, and focused",
  },
  DAY: {
    scenes: [
      "bright studio workspace with balanced natural light",
      "open urban park path under clear midday sky",
      "organized table scene with subtle geometric rhythm",
    ],
    motifs: ["steady linework", "interval markers", "structured spacing"],
    palettes: ["evergreen, warm cream, slate", "olive, parchment, muted teal"],
    mood: "clear, steady, and productive",
  },
  EVENING: {
    scenes: [
      "golden-hour room with long shadows and calm atmosphere",
      "sunset boardwalk with repeating planks and gentle flow",
      "cozy desk lamp scene with softened contrast",
    ],
    motifs: ["tapering light bands", "winding path", "paired anchor objects"],
    palettes: ["amber, charcoal, moss", "burnished gold, smoke blue, olive"],
    mood: "reflective and intentional",
  },
  BEFORE_BED: {
    scenes: [
      "dim bedside scene with soft textiles and low warm light",
      "night window with moon glow and quiet depth",
      "minimal room corner with restful shadow gradients",
    ],
    motifs: ["crescent sweep", "soft layered folds", "slow ripple"],
    palettes: [
      "midnight blue, warm taupe, muted gold",
      "indigo, smoke grey, soft bronze",
    ],
    mood: "calm, quiet, and restorative",
  },
};

function pickVariant(options: string[], seedSource: string): string {
  if (options.length === 0) return "";
  const seed = Array.from(seedSource).reduce(
    (acc, char, idx) => {
      return (acc + char.charCodeAt(0) * (idx + 17)) % 100_000;
    },
    Math.floor(Math.random() * 100_000),
  );
  const index = seed % options.length;
  return options[index];
}

function getThemeForCategory(categoryName: string): CategoryTheme {
  const key = categoryName.toLowerCase().trim();
  for (const [cat, theme] of Object.entries(CATEGORY_THEMES)) {
    if (key.includes(cat) || cat.includes(key)) return theme;
  }
  return {
    scenes: [
      "abstract natural environment with layered hills and contemplative depth",
      "minimal atmospheric landscape with soft depth gradients",
      "quiet editorial backdrop with subtle natural forms",
    ],
    motifs: ["gentle arc", "textured grain", "balanced focal anchor"],
    palettes: ["evergreen, parchment cream, charcoal"],
    mood: "calm and purposeful",
  };
}

function getTaskTheme(bucket?: string | null): CategoryTheme {
  const key = (bucket ?? "DAY").toUpperCase();
  return TASK_BUCKET_THEMES[key] ?? TASK_BUCKET_THEMES.DAY;
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
  const theme = getThemeForCategory(categoryName);
  const seedBase = `${name}-${categoryName}-${description ?? ""}-${Date.now()}`;
  const scene = pickVariant(theme.scenes, `${seedBase}-scene`);
  const motif = pickVariant(theme.motifs, `${seedBase}-motif`);
  const palette = pickVariant(theme.palettes, `${seedBase}-palette`);
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
Subject: ${subjectHint}. Include subtle category motif: ${motif}. Keep the subject minimal and symbolic — no busy character scenes.
Style/medium: premium editorial digital painting with painterly realism, textured and atmospheric.
Composition/framing: landscape 16:9, strong negative space for UI overlays (text will sit over this image with a dark gradient scrim). Subject weighted to one side.
Lighting/mood: ${theme.mood}, contemplative, grounded, quietly motivating.
Color palette: ${palette} with low saturation and restrained contrast — avoid neon or candy colors.
Constraints: no text, no logos, no watermarks, no UI elements in the image. Image will be dimmed and used as a card background.
Avoid: cluttered scenes, high-action poses, fantasy/sci-fi elements, stock photo look, bright competing focal points.`;
}

interface TaskPromptParams {
  name: string;
  description?: string | null;
  frequency: string;
  bucket?: string | null;
  categoryName?: string | null;
}

export function generateTaskImagePrompt({
  name,
  description,
  frequency,
  bucket,
  categoryName,
}: TaskPromptParams): string {
  const lighting = BUCKET_LIGHTING[bucket ?? "DAY"] ?? BUCKET_LIGHTING.DAY;
  const categoryTheme = categoryName ? getThemeForCategory(categoryName) : null;
  const theme = categoryTheme ?? getTaskTheme(bucket);
  const categoryLine = categoryName
    ? `Task category context: "${categoryName}" — keep this theme recognizable but subtle.`
    : "";
  const seedBase = `${name}-${bucket ?? "day"}-${categoryName ?? ""}-${description ?? ""}-${Date.now()}`;
  const scene = pickVariant(theme.scenes, `${seedBase}-scene`);
  const motif = pickVariant(theme.motifs, `${seedBase}-motif`);
  const palette = pickVariant(theme.palettes, `${seedBase}-palette`);
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
${categoryLine}
Scene/backdrop: ${scene}. Reinforce recurring rhythm through repeating natural intervals and gentle depth layers.
Subject: minimal symbolic objects suggesting spacing and cadence with motif ${motif} — not literal app UI or task lists.
Style/medium: refined textured illustration with subtle grain, soft gradients, premium wellness aesthetic.
Composition/framing: landscape 16:9, directional flow, clear breathing room for UI overlays with dark gradient scrim.
Lighting/mood: ${lighting}.
Color palette: ${palette}; muted teal can be a secondary accent sparingly.
Constraints: no text, no icons, no watermarks, no UI elements. Image will be dimmed and used as a card background.
Avoid: clip-art, neon colors, chaotic scatter, stock photo look, harsh contrast.`;
}
