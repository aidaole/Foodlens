// At most 0.8 MB of thumbnail text for 50 foods. No temporary file/blob URLs.
export const MAX_THUMBNAIL_LENGTH = 16000;
export function isHistoryThumbnail(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_THUMBNAIL_LENGTH &&
    /^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+={0,2}$/.test(value);
}
export function restoreThumbnails(value: unknown, ids: string[]): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const source = value as Record<string, unknown>;
  return Object.fromEntries(ids.slice(0,50).filter(id=>isHistoryThumbnail(source[id])).map(id=>[id,source[id] as string]));
}
