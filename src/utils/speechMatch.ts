/**
 * Compares spoken text against a target phrase and returns the fraction
 * (0–1) of the target's words that were heard in the spoken text.
 * Tolerant of filler words, punctuation, and minor mis-hearings.
 */
export function speechMatchRatio(spoken: string, target: string): number {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);

  const targetWords = normalize(target);
  if (targetWords.length === 0) return 0;

  const spokenWords = new Set(normalize(spoken));
  const matched = targetWords.filter((word) => spokenWords.has(word)).length;

  return matched / targetWords.length;
}
