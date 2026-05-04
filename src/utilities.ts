export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomItem<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[randomInt(0, items.length - 1)];
}

export function showError(error: unknown): string {
  return String(error instanceof Error ? error.message : error);
}

export function tryBlock<T>(
  k: () => T,
): { success: true; output: T } | { success: false; error: Error } {
  try {
    return { success: true, output: k() };
  } catch (error) {
    if (error instanceof Error) return { success: false, error };
    else throw error;
  }
}

export function do_<T>(k: () => T): T {
  return k();
}

export function showDate(date: Date): string {
  return date.toISOString().split("T")[0]!;
}

/**
 * Formats a given Date object into a string containing both date and time.
 * @param date - The Date object to format.
 * @returns A string in the format 'YYYY-MM-DD at HH:MM'.
 */
export function showDateTime(date: Date): string {
  // Extract local date components and pad to 2 digits
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  // Extract local time components and pad to 2 digits
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  // Combine into the required format
  return `${yyyy}-${mm}-${dd} at ${hh}:${min}`;
}

/**
 * Formats a given Date object into a string containing only the time.
 * @param date - The Date object to format.
 * @returns A string in the format 'HH:MM'.
 */
export function showTime(date: Date): string {
  // Extract local time components and pad to 2 digits
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  // Combine into the required format
  return `${hh}:${min}`;
}

/**
 * Escapes a string to be safe for use as a filename on MacOS.
 * It replaces forward slashes (`/`), colons (`:`), and null characters (`\\0`)
 * with underscores to ensure the string is a valid file name.
 *
 * @param s - The string to escape.
 * @returns The escaped string safe for use as a filename.
 */
export function escapeFilename(s: string): string {
  // Replace MacOS path separators (both POSIX '/' and HFS ':')
  // and null characters with underscores.
  return s.replace(/[/:\\x00]/g, "_");
}

export function matchEnum<S extends string, T>(s: S, k: { [k in S]: () => T }) {
  return k[s]();
}
