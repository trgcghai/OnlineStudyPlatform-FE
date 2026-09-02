export const activeLessonStorageKey = (courseId: string) =>
  `learning-player:${courseId}:activeLessonId`;

export const videoPositionStorageKey = (courseId: string, lessonId: string) =>
  `learning-player:${courseId}:${lessonId}:position`;

export function safeReadLocalStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeWriteLocalStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

export function safeReadNumber(key: string): number | null {
  const value = safeReadLocalStorage(key);
  if (!value) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function safeWriteNumber(key: string, value: number): void {
  if (!Number.isFinite(value)) return;
  safeWriteLocalStorage(key, String(Math.max(0, value)));
}
