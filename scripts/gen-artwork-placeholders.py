"""Generate minimal placeholder SVGs for artwork briefs (dev-only helper)."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "public" / "artifacts"

SPECS = [
    ("habits-library", "Habits — rituals shelf"),
    ("tasks-flow", "Tasks — rhythm & clarity"),
    ("stats-reflection", "Stats — curves & horizon"),
    ("categories-garden", "Categories — paths & bins"),
    ("settings-sanctuary", "Settings — calm control"),
    ("achievements-glow", "Achievements — quiet win"),
    ("empty-state-dawn", "Empty — invite first step"),
    ("onboarding-steps", "Onboarding — stepping stones"),
    ("nfc-tap", "NFC — token & glow"),
]

TEMPLATE = """<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="420" viewBox="0 0 1200 420" fill="none">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="420" gradientUnits="userSpaceOnUse">
      <stop stop-color="#1a241f"/>
      <stop offset="1" stop-color="#0c1110"/>
    </linearGradient>
    <linearGradient id="glow" x1="600" y1="0" x2="600" y2="420" gradientUnits="userSpaceOnUse">
      <stop stop-color="#c79a52" stop-opacity="0.12"/>
      <stop offset="1" stop-color="#0c1110" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="420" fill="url(#bg)"/>
  <rect width="1200" height="420" fill="url(#glow)"/>
  <text x="600" y="200" text-anchor="middle" fill="#7d9c73" fill-opacity="0.35" font-family="Georgia,serif" font-size="64">···</text>
  <text x="600" y="268" text-anchor="middle" fill="#b4a58a" font-family="system-ui,sans-serif" font-size="15" letter-spacing="0.08em">{label}</text>
  <text x="600" y="298" text-anchor="middle" fill="#6a6358" font-family="system-ui,sans-serif" font-size="11">Replace with PNG from generationPrompt in lib/artwork.ts</text>
</svg>
"""


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    for slug, label in SPECS:
        path = ROOT / f"{slug}-placeholder.svg"
        path.write_text(TEMPLATE.format(label=label), encoding="utf-8")
        print("wrote", path)


if __name__ == "__main__":
    main()
