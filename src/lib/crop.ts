export type CropRect = { x: number; y: number; width: number; height: number };
export type CropMode = "move" | "tl" | "tr" | "bl" | "br";
export const fullCrop: CropRect = { x: 0, y: 0, width: 1, height: 1 };
const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));
export function moveCrop(
  r: CropRect,
  mode: CropMode,
  dx: number,
  dy: number,
  minWidth = 0.05,
  minHeight = 0.05,
): CropRect {
  if (mode === "move")
    return {
      ...r,
      x: clamp(r.x + dx, 0, 1 - r.width),
      y: clamp(r.y + dy, 0, 1 - r.height),
    };
  let left = r.x,
    right = r.x + r.width,
    top = r.y,
    bottom = r.y + r.height;
  if (mode.endsWith("l")) left = clamp(left + dx, 0, right - minWidth);
  else right = clamp(right + dx, left + minWidth, 1);
  if (mode.startsWith("t")) top = clamp(top + dy, 0, bottom - minHeight);
  else bottom = clamp(bottom + dy, top + minHeight, 1);
  return { x: left, y: top, width: right - left, height: bottom - top };
}
export function cropPixels(r: CropRect, iw: number, ih: number) {
  const originX = clamp(Math.floor(r.x * iw), 0, iw - 1),
    originY = clamp(Math.floor(r.y * ih), 0, ih - 1);
  return {
    originX,
    originY,
    width: clamp(Math.round(r.width * iw), 1, iw - originX),
    height: clamp(Math.round(r.height * ih), 1, ih - originY),
  };
}
export function fitImage(iw: number, ih: number, bw: number, bh: number) {
  const scale = Math.min(bw / iw, bh / ih);
  return {
    width: iw * scale,
    height: ih * scale,
    x: (bw - iw * scale) / 2,
    y: (bh - ih * scale) / 2,
  };
}
export function insetCrop(r: CropRect, amount = 0.1): CropRect {
  const a = Math.min(amount, r.width * 0.25, r.height * 0.25);
  return {
    x: r.x + a,
    y: r.y + a,
    width: r.width - 2 * a,
    height: r.height - 2 * a,
  };
}
