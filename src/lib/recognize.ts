import { ImageManipulator, SaveFormat, type ImageRef } from "expo-image-manipulator";
import { isCloudFood } from "./recognition-schema";
import type { Food } from "./food";
import type { Photo } from "../components/PhotoCrop";
import { compressLabelPhoto, type UploadInfo } from "./photo-compression";
import { RecognitionError, requestJson, connectService, prepareWithinDeadline, CONNECTION_TIMEOUT_MS, MODEL_TIMEOUT_MS, type RecognitionStage } from "./recognition-network";
import { compressHistoryThumbnail } from "./history-thumbnail";
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
    const encoded = await compressLabelPhoto(photo.width, photo.height, async (plan) => {
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
    // Keep the rendered photo alive until its local thumbnail is encoded. Native
    // camera/cache files must not be reopened after a potentially long AI request.
    let thumbnail: string | undefined;
    try {
      if (image) thumbnail = await historyThumbnail(image, signal);
    } catch { /* Try the immutable upload below if the native ref is unavailable. */ }
    if (!thumbnail && !signal.aborted) {
      // Also retry when the ref supplied no usable dimensions or thumbnail data.
      try {
        thumbnail = await historyThumbnail("data:image/jpeg;base64," + encoded.base64, signal, encoded.width, encoded.height);
      } catch { /* A genuine local image failure does not invalidate the label. */ }
    }
    return { ...encoded, thumbnail };
  } catch (error) {
    if (error instanceof RecognitionError) throw error;
    throw new RecognitionError("图片读取失败，请重新选图或裁剪。", "IMAGE");
  } finally {
    image?.release();
    ctx?.release();
  }
}
async function historyThumbnail(source: ImageRef | string, signal: AbortSignal, width?: number, height?: number): Promise<string | undefined> {
  const sourceWidth = typeof source === "string" ? width! : source.width;
  const sourceHeight = typeof source === "string" ? height! : source.height;
  let ctx: ReturnType<typeof ImageManipulator.manipulate> | undefined;
  let size = "";
  let image: ImageRef | undefined;
  try {
    return await compressHistoryThumbnail(sourceWidth, sourceHeight, async plan => {
      const nextSize = plan.width + "x" + plan.height;
      if (!image || size !== nextSize) {
        image?.release(); image = undefined;
        ctx?.release(); ctx = undefined;
        ctx = ImageManipulator.manipulate(source);
        ctx.resize({width:plan.width,height:plan.height});
        image = await ctx.renderAsync();
        size = nextSize;
      }
      const saved = await image.saveAsync({format:SaveFormat.JPEG,compress:plan.quality,base64:true});
      return saved.base64 ?? "";
    }, signal);
  } finally { image?.release(); ctx?.release(); }
}
export async function recognizePhoto(
  photo: Photo,
  signal: AbortSignal,
  onStage?: (stage: RecognitionStage) => void,
  onPrepared?: (info: UploadInfo) => void,
): Promise<{ food: Food; thumbnail?: string }> {
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
    if (signal.aborted) throw new RecognitionError("已取消识别，照片已保留。", "CANCELED");
    return { food: data.food, thumbnail: encoded.thumbnail };
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
