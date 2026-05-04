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

/**
 * Formats a given Date object into a string containing only the date.
 * @param date - The Date object to format.
 * @returns A string in the format 'YYYY-MM-DD'.
 */
export function showDate(date: Date): string {
  // Extract local date components and pad to 2 digits
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  // Combine into the required format
  return `${yyyy}-${mm}-${dd}`;
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

/**
 * Computes the next time of day, starting from one minute after the
 * {@link startDate}, that the time of day will be the specified
 * {@link timeOfDate} (in 24 hour time).
 *
 * @param startDate -- The start date to find the next time of day right after.
 * @param timeOfDay - The hour and minute to target.
 * @returns A Date object representing the next occurrence of the specified
 * time.
 */
export function nextTimeOfDay(
  startDate: Date,
  timeOfDay: {
    hour: number;
    minute: number;
  },
): Date {
  // Get current time
  const now = new Date();

  // Set the start date to one minute after now to find the "next" occurrence
  startDate = new Date(startDate.getTime() + 60000);

  // Create the target date based on today with the specified hour and minute
  const targetDate = new Date(now);
  targetDate.setHours(timeOfDay.hour, timeOfDay.minute, 0, 0);

  // If the target date today is before the start time, then the next occurrence is tomorrow
  if (targetDate.getTime() < startDate.getTime()) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  return targetDate;
}
