// Analog scale for DAILY COUNT habits. Colors progress from red (no logs)
// through orange/yellow/lime to green (target met). Chosen to read cleanly
// on the dark surface and stay consistent with the BOOLEAN completed/failed
// palette at the two ends.
export const COUNT_SCALE = {
  green: "#7d9c73", // >= 100%
  lime: "#a8b05a", // 66-99%
  yellow: "#d4a843", // 33-66%
  orange: "#c8864a", // >0-33%
  red: "#b66b5a", // 0%
} as const;

export function countScaleColor(value: number, threshold: number): string {
  const ratio = threshold > 0 ? value / threshold : 0;
  if (ratio >= 1) return COUNT_SCALE.green;
  if (ratio >= 2 / 3) return COUNT_SCALE.lime;
  if (ratio >= 1 / 3) return COUNT_SCALE.yellow;
  if (ratio > 0) return COUNT_SCALE.orange;
  return COUNT_SCALE.red;
}
