/**
 * Utility functions for shuffling and selecting items from arrays.
 */

/**
 * Fisher-Yates (Knuth) shuffle algorithm.
 * Returns a new shuffled array without mutating the original.
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Returns a random item from the array.
 * Throws if the array is empty.
 */
export function getRandomItem<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error('Cannot get random item from an empty array');
  }
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Simple string hash that produces a positive integer.
 * Used internally by getDailyItem for deterministic selection.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Returns the same item for a given day, using a simple hash of the date string
 * as the index into the array.
 *
 * @param array - The array to select from
 * @param seed - Optional seed string; defaults to today's date in YYYY-MM-DD format
 * @returns The deterministically selected item for the day
 */
export function getDailyItem<T>(array: T[], seed?: string): T {
  if (array.length === 0) {
    throw new Error('Cannot get daily item from an empty array');
  }
  const dateString = seed ?? new Date().toISOString().split('T')[0];
  const index = hashString(dateString) % array.length;
  return array[index];
}
