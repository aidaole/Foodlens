import { RecognitionError } from "./recognition-network.ts";

export type UploadInfo = { width: number; height: number; bytes: number; uri?: string };
export type EncodingPlan = { width: number; height: number; quality: number };
export type EncodedPhoto = { width: number; height: number; base64: string; uri?: string };
export const TARGET_IMAGE_BYTES = 750 * 1024;
export const MAX_IMAGE_BYTES = 1800000;

export function compressionPlans(width: number, height: number): EncodingPlan[] {
  if (![width, height].every(v => Number.isFinite(v) && v > 0))
    throw new RecognitionError("图片尺寸无效，请重新选图。", "IMAGE");
  const size = (limit: number) => {
    const scale = Math.min(1, limit / Math.max(width, height));
    return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
  };
  const high = size(2400);
  const plans: EncodingPlan[] = [{...high, quality:0.86}, {...high, quality:0.76}];
  for (const limit of [2048, 1800]) {
    const next = size(limit);
    if (!plans.some(p => p.width === next.width && p.height === next.height))
      plans.push({...next, quality:0.82});
  }
  return plans;
}

export function jpegBytes(base64: string) {
  if (!base64 || base64.length % 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64))
    throw new RecognitionError("图片数据读取失败，请重新选图。", "IMAGE");
  return base64.length * 3 / 4 - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
}

export async function compressLabelPhoto(
  width: number, height: number,
  encode: (plan: EncodingPlan) => Promise<EncodedPhoto>,
  signal: AbortSignal,
) {
  let best: (EncodedPhoto & UploadInfo) | undefined;
  for (const plan of compressionPlans(width, height)) {
    if (signal.aborted) throw new RecognitionError("已取消识别，照片已保留。", "CANCELED");
    const encoded = await encode(plan);
    if (signal.aborted) throw new RecognitionError("已取消识别，照片已保留。", "CANCELED");
    const result = {...encoded, bytes:jpegBytes(encoded.base64)};
    if (!best || result.bytes < best.bytes) best = result;
    if (result.bytes <= TARGET_IMAGE_BYTES) return result;
  }
  if (best && best.bytes <= MAX_IMAGE_BYTES) return best;
  throw new RecognitionError("标签图片仍然过大，请裁掉包装之外的背景后重试。", "IMAGE");
}
