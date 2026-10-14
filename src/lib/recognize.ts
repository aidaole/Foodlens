import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { isCloudFood } from "./recognition-schema";
import type { Food } from "./food";
import type { Photo } from "../components/PhotoCrop";
import { compressLabelPhoto, type UploadInfo } from "./photo-compression";
import { RecognitionError, requestJson, connectService, prepareWithinDeadline, CONNECTION_TIMEOUT_MS, MODEL_TIMEOUT_MS, type RecognitionStage } from "./recognition-network";
import { isHistoryThumbnail } from "./history-thumbnail";
export type { UploadInfo } from "./photo-compression";
export { RecognitionError } from "./recognition-network";
const endpoint = (process.env.EXPO_PUBLIC_RECOGNITION_URL ?? "").replace(
  /\/$/,
  "",
);
export const recognitionBrowserURL = endpoint;
export const cloudConfigured =
  /^https:\/\//.test(endpoint) ||
  (__DEV__ && /^http:\/\/(localhost|127\.0\.0\.1):/.test(endpoint));
let session: { token: string; expiresAt: number } | null = null;
async function json(
  path: string,
  body: unknown,
  signal: AbortSignal,
  token?: string,
) {
  return requestJson(endpoint + path, {
    signal, body, token,
    connection: path === "/v1/session",
    timeoutMs: path === "/v1/session" ? CONNECTION_TIMEOUT_MS : MODEL_TIMEOUT_MS,
  });
}
async function getSession(signal: AbortSignal) {
  if (session && session.expiresAt > Date.now() / 1000 + 30)
    return session.token;
  const s = await json("/v1/session", {}, signal);
  if (typeof s?.token !== "string" || typeof s?.expiresAt !== "number")
    throw new RecognitionError("连接未建立，请重试。", "SERVER");
  session = { token: s.token, expiresAt: s.expiresAt };
  return session.token;
}
async function encodePhoto(photo: Photo, signal: AbortSignal) {
  let ctx: ReturnType<typeof ImageManipulator.manipulate> | undefined;
  let image: Awaited<ReturnType<ReturnType<typeof ImageManipulator.manipulate>["renderAsync"]>> | undefined;
  let size = "";
  try {
    return await compressLabelPhoto(photo.width, photo.height, async (plan) => {
      const nextSize = plan.width + "x" + plan.height;
      if (!image || size !== nextSize) {
        image?.release(); image = undefined;
        ctx?.release(); ctx = undefined;
        ctx = ImageManipulator.manipulate(photo.uri);
        if (plan.width !== photo.width || plan.height !== photo.height)
          ctx.resize({ width:plan.width, height:plan.height });
        image = await ctx.renderAsync();
        size = nextSize;
      }
      const saved = await image.saveAsync({format:SaveFormat.JPEG, compress:plan.quality, base64:true});
      return {uri:saved.uri, width:saved.width, height:saved.height, base64:saved.base64 ?? ""};
    }, signal);
  } catch (error) {
    if (error instanceof RecognitionError) throw error;
    throw new RecognitionError("图片读取失败，请重新选图或裁剪。", "IMAGE");
  } finally {
    image?.release();
    ctx?.release();
  }
}
async function historyThumbnail(uri: string): Promise<string | undefined> {
  const ctx = ImageManipulator.manipulate(uri);
  let image: Awaited<ReturnType<typeof ctx.renderAsync>> | undefined;
  try {
    // Preserve the whole label, even for portrait/landscape crops.
    const original = await ctx.renderAsync();
    const scale = Math.min(1, 240 / Math.max(original.width,original.height));
    const w = Math.max(1,Math.round(original.width*scale)), h = Math.max(1,Math.round(original.height*scale));
    original.release();
    ctx.resize({width:w,height:h});
    image = await ctx.renderAsync();
    for (const quality of [0.68,0.45]) {
      const saved = await image.saveAsync({format:SaveFormat.JPEG,compress:quality,base64:true});
      const uri = "data:image/jpeg;base64," + (saved.base64 ?? "");
      if (isHistoryThumbnail(uri)) return uri;
    }
  } finally { image?.release(); ctx.release(); }
}
export async function recognizePhoto(
  photo: Photo,
  signal: AbortSignal,
  onStage?: (stage: RecognitionStage) => void,
  onPrepared?: (info: UploadInfo) => void,
  onThumbnail?: (uri: string) => void,
): Promise<Food> {
  if (!cloudConfigured)
    throw new RecognitionError(
      "云端识别还在等待账号接通。你可以先体验拍照、裁剪和示例分析。",
      "NOT_READY",
    );
  onStage?.("preparing");
  // The native task owns its references until it settles, even if the UI cancels.
  const encoded = await prepareWithinDeadline(encodePhoto(photo, signal), signal);
  onPrepared?.({uri:encoded.uri, width:encoded.width, height:encoded.height, bytes:encoded.bytes});
  onStage?.("connecting");
  await connectService(endpoint, signal);
  const body = { image:"data:image/jpeg;base64," + encoded.base64 };
  try {
    onStage?.("connecting");
    let token = await getSession(signal);
    onStage?.("recognizing");
    let data;
    try {
      data = await json("/v1/recognize", body, signal, token);
    } catch (error) {
      if (!(error instanceof RecognitionError) || error.code !== "SESSION")
        throw error;
      session = null;
      token = await getSession(signal);
      data = await json("/v1/recognize", body, signal, token);
    }
    if (!isCloudFood(data?.food))
      throw new RecognitionError("识别数据不完整，请重新拍摄。", "RETAKE");
    try {
      const thumbnail = await prepareWithinDeadline(historyThumbnail(encoded.uri ?? body.image), signal, 5000);
      if (thumbnail) onThumbnail?.(thumbnail);
    } catch { /* Recognition remains usable when a local thumbnail cannot be made. */ }
    if (signal.aborted) throw new RecognitionError("已取消识别，照片已保留。", "CANCELED");
    return data.food;
  } catch (error) {
    if (signal.aborted)
      throw new RecognitionError(
        "已取消识别，照片已保留。",
        "CANCELED",
      );
    if (error instanceof RecognitionError) throw error;
    throw new RecognitionError(
      "网络暂时没有连接成功，请检查网络后重试。",
      "NETWORK",
    );
  }
}
