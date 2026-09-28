export function getSafeNotificationActionUrl(
  actionUrl: string | null,
): string | null {
  if (
    !actionUrl ||
    !actionUrl.startsWith("/") ||
    actionUrl.startsWith("//") ||
    actionUrl.startsWith("/\\") ||
    actionUrl.includes("\\")
  ) {
    return null;
  }

  return actionUrl;
}
