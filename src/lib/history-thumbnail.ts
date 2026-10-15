// At most 0.8 MB of thumbnail text for 50 foods. No temporary file/blob URLs.
export const MAX_THUMBNAIL_LENGTH = 16000;
export type ThumbnailPlan = { width: number; height: number; quality: number };
export function thumbnailPlans(width: number, height: number): ThumbnailPlan[] {
  if (![width, height].every(n => Number.isFinite(n) && n > 0)) return [];
  const plans: ThumbnailPlan[] = [];
  for (const limit of [240, 200, 160, 120, 96]) {
    const scale = Math.min(1, limit / Math.max(width, height));
    const size = { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
    if (plans.some(p => p.width === size.width && p.height === size.height)) continue;
    for (const quality of [0.68, 0.45]) plans.push({ ...size, quality });
  }
  return plans;
}
export async function compressHistoryThumbnail(
  width: number,
  height: number,
  encode: (plan: ThumbnailPlan) => Promise<string>,
  signal: AbortSignal,
): Promise<string | undefined> {
  for (const plan of thumbnailPlans(width, height)) {
    if (signal.aborted) return;
    const base64 = await encode(plan);
    if (signal.aborted) return;
    const uri = "data:image/jpeg;base64," + base64;
    if (isHistoryThumbnail(uri)) return uri;
  }
}
export function isHistoryThumbnail(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_THUMBNAIL_LENGTH &&
    /^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+={0,2}$/.test(value);
}
export function restoreThumbnails(value: unknown, ids: string[]): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const source = value as Record<string, unknown>;
  return Object.fromEntries(ids.slice(0,50).filter(id=>isHistoryThumbnail(source[id])).map(id=>[id,source[id] as string]));
}

// Read dimensions from the saved JPEG instead of loading it a second time through
// Image.getSize. A metadata lookup failure must not hide a renderable photo.
export function thumbnailDimensions(uri?: string): { width: number; height: number } | undefined {
  if (!isHistoryThumbnail(uri)) return;
  const base64 = uri.slice("data:image/jpeg;base64,".length);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes = new Uint8Array(Math.floor(base64.length * 3 / 4));
  let bits = 0, buffer = 0, length = 0;
  for (const char of base64) {
    if (char === "=") break;
    buffer = (buffer << 6) | alphabet.indexOf(char);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[length++] = (buffer >> bits) & 255;
    }
  }
  let offset = 2;
  while (offset + 3 < length) {
    if (bytes[offset++] !== 255) return;
    while (offset < length && bytes[offset] === 255) offset++;
    const marker = bytes[offset++];
    if (marker === 0xda || marker === 0xd9) return;
    if (marker === 0x01 || marker >= 0xd0 && marker <= 0xd7) continue;
    const size = (bytes[offset] << 8) | bytes[offset + 1];
    if (size < 2 || offset + size > length) return;
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      if (size < 8) return;
      const height = (bytes[offset + 3] << 8) | bytes[offset + 4];
      const width = (bytes[offset + 5] << 8) | bytes[offset + 6];
      if (width > 0 && height > 0) return { width, height };
      return;
    }
    offset += size;
  }
}
