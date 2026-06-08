/**
 * Speech recognizers have no reason to expect a given person's name — so
 * names spoken in a journal entry, especially uncommon ones or the speaker's
 * own, often come back as the nearest English-sounding word instead. This
 * scans a finished transcript for words that are a near-miss for a name in
 * a known repository and swaps in the correctly spelled name.
 */

function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }

  return dp[a.length][b.length];
}

const WORD_PATTERN = /[A-Za-z']+/g;

/**
 * Replaces words in `text` that are a close phonetic/spelling match for a
 * name in `names` with that name's correct spelling. Exact (case-insensitive)
 * matches are normalized to the repository's casing; near-misses are corrected
 * only when they share a first letter (keeps the match phonetically plausible
 * and avoids swapping unrelated words like "head" for "Hadi") and fall within
 * a length-scaled edit-distance threshold.
 */
export function correctNamesInTranscript(text: string, names: string[]): string {
  if (!text || names.length === 0) return text;

  return text.replace(WORD_PATTERN, (word) => {
    const lower = word.toLowerCase();
    let best: { name: string; distance: number } | null = null;

    for (const name of names) {
      const lowerName = name.toLowerCase();
      if (lowerName === lower) return name;
      if (lowerName[0] !== lower[0]) continue;

      const distance = levenshteinDistance(lower, lowerName);
      const threshold = lowerName.length <= 4 ? 1 : 2;
      if (distance <= threshold && (!best || distance < best.distance)) {
        best = { name, distance };
      }
    }

    return best ? best.name : word;
  });
}
