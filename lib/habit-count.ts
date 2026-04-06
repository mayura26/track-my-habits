/** Default + tap size from the goal (e.g. 2000 → 250). Used when `countIncrement` is unset. */
export function defaultCountStep(threshold: number): number {
  if (threshold >= 500) {
    return Math.min(500, Math.max(25, Math.round(threshold / 8)));
  }
  if (threshold >= 50) {
    return Math.min(50, Math.max(5, Math.round(threshold / 10)));
  }
  return 1;
}

export function formatCountAmount(n: number): string {
  return Number.isInteger(n) ? String(Math.round(n)) : n.toFixed(1);
}

/** Preset step sizes for the habit card; always includes the auto default. */
export function countStepPresets(threshold: number): number[] {
  const auto = defaultCountStep(threshold);
  const set = new Set<number>([1, auto]);
  for (const f of [0.05, 0.1, 0.125, 0.25, 0.5]) {
    const x = Math.max(1, Math.round(threshold * f));
    if (x <= threshold) set.add(x);
  }
  for (const x of [5, 10, 25, 50, 100, 250, 500, 1000]) {
    if (x <= threshold) set.add(x);
  }
  return [...set].sort((a, b) => a - b);
}

export function effectiveCountStep(
  threshold: number,
  countIncrement: number | null,
): number {
  return countIncrement ?? defaultCountStep(threshold);
}
