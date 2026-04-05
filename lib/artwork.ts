export type ArtworkId =
  | "dashboardHero"
  | "signinJourney"
  | "habitsLibrary"
  | "tasksFlow"
  | "statsReflection"
  | "categoriesGarden"
  | "settingsSanctuary"
  | "achievementsGlow"
  | "emptyStateDawn"
  | "onboardingSteps"
  | "nfcTap";

export interface ArtworkBrief {
  id: ArtworkId;
  title: string;
  assetPath: string;
  status: "ready" | "placeholder";
  intendedUse: string;
  alt: string;
  promptSummary: string;
  visualDirection: string;
  generationPrompt: string;
}

export const artworkBriefs: Record<ArtworkId, ArtworkBrief> = {
  dashboardHero: {
    id: "dashboardHero",
    title: "Dawn momentum",
    assetPath: "/artifacts/dashboard-hero.png",
    status: "ready",
    intendedUse: "Dashboard hero editorial artwork",
    alt: "Solitary figure at dawn overlooking a misty valley",
    promptSummary:
      "Cinematic dawn landscape with a solitary reflective figure and clear negative space for UI overlays.",
    visualDirection:
      "Painterly realism, grounded self-improvement, forest green and brushed gold.",
    generationPrompt: `Use case: illustration-story
Asset type: dashboard hero artwork
Primary request: Create a cinematic self-improvement illustration for a habit tracking dashboard.
Scene/backdrop: misty dawn landscape with rolling hills, soft fog, distant sunrise, subtle path leading forward.
Subject: a solitary figure standing on a ridge in reflective posture, reading as calm and disciplined rather than dramatic.
Style/medium: premium editorial digital painting with painterly realism.
Composition/framing: tall portrait crop with clean negative space near upper left and lower left so UI overlays remain legible.
Lighting/mood: warm sunrise rim light, contemplative, grounded, hopeful.
Color palette: forest green, parchment cream, brushed gold, soft charcoal.
Constraints: no text, no logo, no watermark, avoid fantasy armor or sci-fi elements.
Avoid: neon colors, cluttered foreground, high-action poses.`,
  },
  signinJourney: {
    id: "signinJourney",
    title: "Quiet reset",
    assetPath: "/artifacts/signin-journey.png",
    status: "ready",
    intendedUse: "Sign-in page companion artwork",
    alt: "Lantern-lit stone path through misty hills",
    promptSummary:
      "Warm symbolic journey scene with lanterns, steps, and layered hills to suggest personal rebuilding.",
    visualDirection:
      "Luxury wellness illustration, textured atmosphere, deep evergreen and antique gold.",
    generationPrompt: `Use case: stylized-concept
Asset type: sign-in hero artwork
Primary request: Create a warm editorial illustration about personal growth and rebuilding daily habits.
Scene/backdrop: abstract natural environment with a winding path, layered hills, textured sky, and subtle celestial glow.
Subject: symbolic journey markers such as stones, steps, lanterns, or quiet milestones rather than a busy character scene.
Style/medium: refined textured illustration with a luxury wellness brand feel.
Composition/framing: portrait orientation with strong vertical flow and clear visual focus in the lower third.
Lighting/mood: calm, restorative, uplifting.
Color palette: deep evergreen, muted black, parchment beige, antique gold.
Constraints: no text, no app UI in image, no watermark.
Avoid: stock-photo look, harsh contrast, purple accents.`,
  },
  habitsLibrary: {
    id: "habitsLibrary",
    title: "Ritual shelf",
    assetPath: "/artifacts/habits-library-placeholder.svg",
    status: "placeholder",
    intendedUse: "Habits list / rituals header strip",
    alt: "Soft-lit shelf of journals and stones suggesting ordered daily rituals",
    promptSummary:
      "Wide editorial banner: calm ‘library of rituals’ with stones, linen, and morning light—space for title overlay.",
    visualDirection:
      "Grounded wellness editorial, tactile materials, forest green and brushed gold accents.",
    generationPrompt: `Use case: section-banner
Asset type: wide habits / rituals header (replace habits-library-placeholder.svg → habits-library.png)
Primary request: Create a wide panoramic illustration for a habits list screen in a habit tracking app.
Scene/backdrop: a quiet study-nook meets forest veranda—wood shelf, folded cloth, stacked stones, small plants, soft morning haze.
Subject: symbolic of repeatable rituals (not a busy character scene); optional silhouette in deep background, out of focus.
Style/medium: premium editorial digital painting, tactile, slightly painterly.
Composition/framing: landscape ~21:9 feel, strong negative space in upper third for headings, calm horizon line.
Lighting/mood: warm side light, serene, disciplined optimism.
Color palette: forest green, parchment cream, brushed gold, charcoal.
Constraints: no text, no logos, no UI mockups, no watermark.
Avoid: neon, clutter, motivational poster clichés, clocks with harsh glare.`,
  },
  tasksFlow: {
    id: "tasksFlow",
    title: "Rhythm strip",
    assetPath: "/artifacts/tasks-flow-placeholder.svg",
    status: "placeholder",
    intendedUse: "Tasks area — motion and clarity",
    alt: "Abstract flowing lines suggesting spaced recurring tasks",
    promptSummary:
      "Structured but organic flow—checklist energy without drawing literal checkboxes.",
    visualDirection:
      "Slightly more geometric than other scenes; still soft editorial, not corporate flat.",
    generationPrompt: `Use case: section-banner
Asset type: tasks / recurring chores header
Primary request: Illustrate steady rhythm and clarity for recurring household or life tasks—never frantic, always breathable.
Scene/backdrop: abstract rippling bands or stepping stones across a shallow stream metaphor, gentle depth layers.
Subject: minimal symbolic objects (ribbon, twine, leaf) suggesting spacing and cadence—not literal app UI.
Style/medium: refined illustration with subtle grain, soft gradients.
Composition/framing: landscape banner, directional flow left-to-right, clear breathing room for UI on the left.
Lighting/mood: crisp morning clarity, calm focus.
Color palette: evergreen, mist grey, warm gold highlights, muted teal as secondary accent sparingly.
Constraints: no text, no icons, no watermark.
Avoid: clip-art checkmarks, neon greens, chaotic scatter.`,
  },
  statsReflection: {
    id: "statsReflection",
    title: "Quiet metrics",
    assetPath: "/artifacts/stats-reflection-placeholder.svg",
    status: "placeholder",
    intendedUse: "Progress / stats — reflection behind charts",
    alt: "Abstract horizon with soft curves suggesting trends over time",
    promptSummary:
      "Abstract trend language—horizon, soft curves, and depth that can sit behind charts.",
    visualDirection:
      "Data-adjacent but organic; low contrast so charts stay readable.",
    generationPrompt: `Use case: section-banner
Asset type: statistics / progress page mood strip
Primary request: Create a low-contrast atmospheric backdrop concept for habit analytics—supportive, not competing with graphs.
Scene/backdrop: layered hills or folded paper horizons implying accumulation over time; faint aurora-like curves (very subtle).
Subject: no charts or numbers in-frame; purely emotional context.
Style/medium: soft digital matte painting with restrained texture.
Composition/framing: wide banner, darkest at bottom third for chart legibility, lighter mist above.
Lighting/mood: reflective evening calm, hopeful.
Color palette: deep pine, graphite mist, restrained gold glints.
Constraints: no text, no numerals, no watermark.
Avoid: bright competing focal points, stock arrow graphics, purple analytics clichés.`,
  },
  categoriesGarden: {
    id: "categoriesGarden",
    title: "Grouped paths",
    assetPath: "/artifacts/categories-garden-placeholder.svg",
    status: "placeholder",
    intendedUse: "Categories — grouping and order",
    alt: "Garden paths branching into labeled-feeling zones without text",
    promptSummary:
      "Organic ‘bins’ metaphor: mossy paths, stepping stones, subtle color zones.",
    visualDirection:
      "Editorial nature texture; gentle segmentation without harsh lines.",
    generationPrompt: `Use case: section-banner
Asset type: categories organization header
Primary request: Illustrate grouping and gentle order—how habits cluster by theme—without literal folders or icons.
Scene/backdrop: garden courtyard with branching paths, low hedges, three subtle color zones in foliage (muted, not saturated).
Subject: no readable labels; implied structure only.
Style/medium: painterly illustration with rich but controlled detail.
Composition/framing: landscape, balanced thirds, center slightly open for headline.
Lighting/mood: late afternoon warmth, tidy but alive.
Color palette: deep green, clay, soft gold sunlight, stone grey.
Constraints: no text, no watermark.
Avoid: infographic grids, harsh neon category colors.`,
  },
  settingsSanctuary: {
    id: "settingsSanctuary",
    title: "Calm control",
    assetPath: "/artifacts/settings-sanctuary-placeholder.svg",
    status: "placeholder",
    intendedUse: "Settings — minimal focal, very subtle",
    alt: "Minimal still life: candle, stone, and linen in soft focus",
    promptSummary:
      "Minimal sanctuary still life—almost monochrome with one warm accent.",
    visualDirection:
      "Restrained luxury; small safe focal for narrow settings column.",
    generationPrompt: `Use case: inline-card
Asset type: settings page companion (compact crop friendly)
Primary request: A minimal calming vignette about intentional control—tuning a day, not ‘busy admin’.
Scene/backdrop: close still life on dark wood surface—linen fold, smooth stone, brass or wax candle, single leaf.
Subject: still life only; no faces.
Style/medium: macro editorial photography look rendered as illustration, shallow depth of field illusion.
Composition/framing: portrait-friendly or 4:3, subject lower-right, lots of matte negative space.
Lighting/mood: single warm source, meditative.
Color palette: charcoal, evergreen shadow, single brushed gold accent.
Constraints: no text, no gear icons, no watermark.
Avoid: clutter, office supplies pile, futuristic HUD motifs.`,
  },
  achievementsGlow: {
    id: "achievementsGlow",
    title: "Quiet triumph",
    assetPath: "/artifacts/achievements-glow-placeholder.svg",
    status: "placeholder",
    intendedUse: "Achievements / XP — restrained celebration",
    alt: "Soft glow around a simple laurel or stone medal, not casino gold",
    promptSummary:
      "Trophy metaphor with editorial restraint—warm glow, no confetti.",
    visualDirection: "Premium calm reward—not gamey; one luminous accent.",
    generationPrompt: `Use case: section-banner
Asset type: achievements / badges header
Primary request: Celebrate progress quietly—earned light, not loud fanfare, for a habit app achievements screen.
Scene/backdrop: dark velvet-like negative space with a gentle warm bloom.
Subject: abstract laurel wreath, carved stone medal, or lantern glow—pick one motif, keep it simple.
Style/medium: textured illustration with soft bloom lighting.
Composition/framing: landscape banner, glow centered or slightly right; room for title on left.
Lighting/mood: proud but serene.
Color palette: deep evergreen black, antique gold, soft ivory highlights.
Constraints: no text, no rank numbers, no watermark.
Avoid: confetti, casino lighting, purple loot glow, 3D game badges.`,
  },
  emptyStateDawn: {
    id: "emptyStateDawn",
    title: "First light",
    assetPath: "/artifacts/empty-state-dawn-placeholder.svg",
    status: "placeholder",
    intendedUse: "Generic empty state (no habits/tasks yet)",
    alt: "Open horizon at dawn inviting a first small step",
    promptSummary:
      "Hopeful empty-state image matching dashboard world—inviting, never shaming.",
    visualDirection:
      "Same world as dashboard hero but wider, softer, more open center.",
    generationPrompt: `Use case: empty-state-hero
Asset type: empty list illustration for first-time users
Primary request: Create an inviting ‘begin here’ scene for an empty habits list—gentle optimism without busy characters.
Scene/backdrop: wide horizon, mist lifting, simple path or stepping stones leading forward.
Subject: keep subject minimal; suggestion of a single footstep or small candle optional.
Style/medium: editorial digital painting, soft brushwork.
Composition/framing: landscape ~16:9, center-left open for copy and buttons in UI.
Lighting/mood: dawn hope, quiet confidence.
Color palette: forest green, cream fog, brushed gold rim light.
Constraints: no text, no guilt-implying imagery (no broken objects), no watermark.
Avoid: crowded scenes, dark defeatist mood.`,
  },
  onboardingSteps: {
    id: "onboardingSteps",
    title: "Stepping stones",
    assetPath: "/artifacts/onboarding-steps-placeholder.svg",
    status: "placeholder",
    intendedUse: "First-run / how it works — journey metaphor",
    alt: "Stepping stones across calm water toward distant hills",
    promptSummary:
      "Journey metaphor: phased stones, calm water, long horizon—fits a short onboarding story.",
    visualDirection:
      "Life-reset style journey without copying any branded 66-day campaign text.",
    generationPrompt: `Use case: onboarding-modal or first-run panel
Asset type: guided journey illustration
Primary request: Illustrate phased habit building as a crossing—small reliable steps, calm pacing.
Scene/backdrop: stepping stones across still water toward soft hills; mist, morning.
Subject: emphasize stones and water; no characters required.
Style/medium: cinematic illustration, soft detail, premium wellness app aesthetic.
Composition/framing: landscape, strong leading line through stones; safe margins for modal padding.
Lighting/mood: gentle, forward-oriented, reassuring.
Color palette: deep teal-green water shadows, warm stone, gold glints at far horizon.
Constraints: no text, no day-count numbers in image, no watermark, do not include brand names.
Avoid: rushing motion, stormy weather metaphors, cluttered stepping stones.`,
  },
  nfcTap: {
    id: "nfcTap",
    title: "Near touch",
    assetPath: "/artifacts/nfc-tap-placeholder.svg",
    status: "placeholder",
    intendedUse: "NFC habit logging — physical token and soft glow",
    alt: "NFC tag hovering over a warm glow with forest bokeh",
    promptSummary:
      "Tech-meets-ritual: a small token, tactile surface, soft NFC-implied glow (no logos).",
    visualDirection:
      "Premium product-adjacent but illustrative; dark warm base.",
    generationPrompt: `Use case: optional NFC education panel
Asset type: NFC tap illustration for physical habit logging
Primary request: Show a small disc or card token near a phone-sized abstract rectangle without drawing a branded phone; imply tap-to-log.
Scene/backdrop: dark wood surface, soft bokeh leaves, subtle electromagnetic glow ring (abstract, tasteful).
Subject: simple NFC token with blank face (no logos), hovering moment before contact.
Style/medium: semi-realistic illustration with cinematic lighting.
Composition/framing: square or 4:5, centered object, generous negative space.
Lighting/mood: warm, focused, magical but minimal.
Color palette: charcoal, evergreen, gold glow accents.
Constraints: no Apple/Google logos, no app UI, no watermark.
Avoid: harsh sci-fi neon, cluttered circuit boards.`,
  },
};

export const artworkBriefList = Object.values(artworkBriefs);

/** Sidebar and marketing: highlight the two shipped hero assets. */
export const featuredArtworkBriefs: ArtworkBrief[] = [
  artworkBriefs.dashboardHero,
  artworkBriefs.signinJourney,
];
