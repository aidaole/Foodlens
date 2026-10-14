export class RecognitionError extends Error {
  code: string;
  constructor(message: string, code: string) { super(message); this.code = code; }
}
export type RecognitionStage = "preparing" | "connecting" | "recognizing";
export const CONNECTION_TIMEOUT_MS = 10000;
export const MODEL_TIMEOUT_MS = 180000;
export async function prepareWithinDeadline<T>(task: Promise<T>, signal: AbortSignal, timeoutMs = 30000): Promise<T> {
  let rejectAborted: (error: Error) => void = () => {};
  const aborted = new Promise<never>((_, reject) => { rejectAborted = reject; });
  const cancel = () => rejectAborted(new RecognitionError("已取消识别，照片已保留。", "CANCELED"));
  signal.addEventListener("abort", cancel, { once: true });
  if (signal.aborted) cancel();
  const timer = setTimeout(() => rejectAborted(new RecognitionError(
    "图片准备超时，照片已保留，请重新裁剪或选图。", "IMAGE_TIMEOUT",
  )), timeoutMs);
  try { return await Promise.race([task, aborted]); }
  finally { clearTimeout(timer); signal.removeEventListener("abort", cancel); }
}
type RequestOptions = {
  signal: AbortSignal;
  timeoutMs: number;
  connection?: boolean;
  token?: string;
  body?: unknown;
  fetcher?: typeof fetch;
};
export async function requestJson(url: string, options: RequestOptions) {
  const { signal, timeoutMs, connection, token, body, fetcher = fetch } = options;
  if (signal.aborted) throw new RecognitionError("已取消识别，照片已保留。", "CANCELED");
  const controller = new AbortController();
  let rejectAborted: (error: Error) => void = () => {};
  const aborted = new Promise<never>((_, reject) => { rejectAborted = reject; });
  const cancel = () => {
    controller.abort();
    rejectAborted(new RecognitionError("已取消识别，照片已保留。", "CANCELED"));
  };
  signal.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(() => {
    // Reject first so even transports that ignore AbortSignal cannot hang the UI.
    rejectAborted(new RecognitionError(
      connection
        ? "连接识别服务超时，图片尚未发送。请检查网络；如果使用VPN，请确认食刻也通过该网络连接。"
        : "云端识别等待超时，照片已保留，请稍后重试。",
      connection ? "CONNECTION_TIMEOUT" : "MODEL_TIMEOUT",
    ));
    controller.abort();
  }, timeoutMs);
  try {
    return await Promise.race([
      (async () => {
        const response = await fetcher(url, {
          method: body === undefined ? "GET" : "POST",
          signal: controller.signal,
          headers: {
            ...(body === undefined ? {} : { "Content-Type": "application/json" }),
            ...(token ? { Authorization: "Bearer " + token } : {}),
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new RecognitionError(
          data?.error?.message ?? "服务暂时没有响应，请重试。",
          data?.error?.code ?? "SERVER",
        );
        if (!data) throw new RecognitionError("服务连接未完成，请检查网络后重试。", "NETWORK");
        return data;
      })(),
      aborted,
    ]);
  } catch (error) {
    if (error instanceof RecognitionError) throw error;
    if (signal.aborted) throw new RecognitionError("已取消识别，照片已保留。", "CANCELED");
    throw new RecognitionError(
      "无法连接识别服务，请检查网络；如果使用VPN，请确认食刻也通过该网络连接。",
      "NETWORK",
    );
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", cancel);
  }
}
export async function connectService(endpoint: string, signal: AbortSignal, fetcher = fetch, timeoutMs = CONNECTION_TIMEOUT_MS) {
  // Only retry the cheap readiness probe. Never repeat a photo/model request automatically.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const health = await requestJson(endpoint + "/health", { signal, timeoutMs, connection: true, fetcher });
      if (health.ready !== true) throw new RecognitionError("识别服务正在准备，请稍后再试。", "NOT_READY");
      return;
    } catch (error) {
      if (signal.aborted || !(error instanceof RecognitionError) ||
          !["NETWORK", "CONNECTION_TIMEOUT"].includes(error.code) || attempt === 1) throw error;
    }
  }
}
