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
