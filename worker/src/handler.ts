import {
  parseModelText,
  LabelError,
} from "../../src/lib/recognition-schema.ts";
import { issueSession, verifySession, sign, issueIdentity, verifyIdentity } from "./auth.ts";
import { modelInput } from "./model-input.ts";
import { billingAvailable, getSubscription, type BillingEnv } from './membership.ts';
import { MONTHLY_PLAN } from '../../src/lib/membership-plan.ts';
export type Env = BillingEnv & {
  ASSETS?: Fetcher;
  AI: {
    run: (model: string, input: Record<string, unknown>) => Promise<unknown>;
  };
  BUDGET: DurableObjectNamespace;
  REQUEST_LIMITER: {
    limit: (input: { key: string }) => Promise<{ success: boolean }>;
  };
  SESSION_SECRET: string;
  MODEL: string;
  MODEL_ENABLED: string;
  DAILY_LIMIT: string;
  DEVICE_DAILY_LIMIT: string;
  ALLOWED_ORIGINS: string;
};
const MAX_BODY = 2800000;
async function readJson(request: Request) {
  if (Number(request.headers.get("content-length")) > MAX_BODY)
    throw new Error("SIZE");
  if (!request.body) throw new Error("BODY");
  const reader = request.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) {
        await reader.cancel();
        throw new Error("SIZE");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as { image?: unknown };
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (request.method === "GET" && path !== "/health" && !path.startsWith("/v1/") && !path.startsWith('/v2/') && env.ASSETS)
      return env.ASSETS.fetch(request);
    const origin = request.headers.get("Origin");
    const origins = (env.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const headers: Record<string, string> = {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      Vary: "Origin",
    };
    const send = (value: unknown, status = 200) =>
      Response.json(value, { status, headers });
    const fail = (code: string, message: string, status: number) =>
      send({ error: { code, message } }, status);
    if (origin && !origins.includes(origin))
      return fail("ORIGIN", "请求来源未启用。", 403);
    if (origin)
      Object.assign(headers, {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      });
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers });
    if (path === "/health" && request.method === "GET")
      return send({
        service: "FoodLens",
        version: "0.4.4",
        ready: env.MODEL_ENABLED === "true" && !!env.SESSION_SECRET,
      });
    if (!["/v1/session", "/v1/recognize", '/v2/identity', '/v2/membership', '/v2/recognize'].includes(path))
      return fail("NOT_FOUND", "接口不存在。", 404);
    if (request.method !== (path === '/v2/membership' ? 'GET' : 'POST')) return fail("METHOD", "请求方式不支持。", 405);
    if (env.BILLING_ENABLED === 'true' && path.startsWith('/v1/')) return fail('UPDATE_REQUIRED', '请更新食刻后继续使用识别服务。', 410);
    if (
      env.MODEL_ENABLED !== "true" ||
      !env.SESSION_SECRET ||
      env.SESSION_SECRET.length < 32
    )
      return fail("NOT_READY", "识别服务正在准备，请稍后再试。", 503);
    try {
      const ip = request.headers.get("CF-Connecting-IP");
      if (!ip) return fail("NETWORK", "无法确认请求来源，请稍后再试。", 503);
      const day = new Date().toISOString().slice(0, 10);
      const ipKey = await sign(env.SESSION_SECRET, day + ":" + ip);
      if (!(await env.REQUEST_LIMITER.limit({ key: ipKey })).success)
        return fail("RATE_LIMIT", "操作太快了，请一分钟后重试。", 429);
      if (path === "/v1/session")
        return send(await issueSession(env.SESSION_SECRET));
      if (path === '/v2/identity') return send(await issueIdentity(env.SESSION_SECRET));
      const token =
        request.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "";
      const memberRequest = path.startsWith('/v2/');
      const id = memberRequest ? await verifyIdentity(env.SESSION_SECRET, token) : await verifySession(env.SESSION_SECRET, token);
      if (!id) return fail(memberRequest ? 'IDENTITY' : "SESSION", memberRequest ? '使用身份无法验证，请联系支持。' : "连接已过期，请重试。", 401);
      let period;
      try { period = memberRequest ? await getSubscription(env, id) : null; }
      catch { return fail('SUBSCRIPTION_SERVICE', '暂时无法核实会员状态，请稍后重试。不会扣除识别次数。', 503); }
      // Store transaction ownership survives restoring/transferring to a new installation.
      // An app user ID alone must never grant a fresh 50 scans for the same paid period.
      const ledger = period ? 'paid:' + await sign(env.SESSION_SECRET, period.ledgerKey) : 'member:' + id;
      const member = memberRequest ? env.BUDGET.get(env.BUDGET.idFromName(ledger)) : null;
      const memberCall = async (action: string, requestId = '', success = false) => member!.fetch('https://budget/member/' + action, { method: 'POST', body: JSON.stringify({ action, period, requestId, success }) });
      if (path === '/v2/membership') {
        const status = await (await memberCall('status')).json();
        return send({ ...status as object, billingAvailable: billingAvailable(env), plan: MONTHLY_PLAN });
      }
      if (!request.headers.get("Content-Type")?.startsWith("application/json"))
        return fail("TYPE", "请发送标签图片。", 415);
      let body: { image?: unknown };
      try {
        body = await readJson(request);
      } catch (e) {
        return fail(
          "IMAGE",
          e instanceof Error && e.message === "SIZE"
            ? "图片太大，请重新裁剪。"
            : "图片数据无效，请重新拍摄。",
          413,
        );
      }
      if (
        typeof body.image !== "string" ||
        !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(body.image)
      )
        return fail("IMAGE", "图片格式不支持，请重新拍摄。", 415);
      const decoded = atob(body.image.slice("data:image/jpeg;base64,".length));
      if (decoded.length > 2000000)
        return fail("IMAGE", "图片太大，请重新裁剪。", 413);
      if (
        decoded.length < 100 ||
        decoded.charCodeAt(0) !== 255 ||
        decoded.charCodeAt(1) !== 216 ||
        decoded.charCodeAt(2) !== 255
      )
        return fail("IMAGE", "图片文件无效，请重新拍摄。", 415);
      const guard = env.BUDGET.get(env.BUDGET.idFromName("foodlens-global"));
      const requestId = crypto.randomUUID();
      if (member) {
        const reservation = await memberCall('reserve', requestId);
        if (!reservation.ok) {
          const result = await reservation.json() as { code: string };
          return fail(result.code, result.code === 'FREE_QUOTA' ? '3 次免费识别已用完。月会员开放后，每个订阅周期可识别 50 次。' : result.code === 'BUSY' ? '上一张标签正在识别，请稍后再试。' : '本订阅周期的 50 次识别已用完，下次续订后重置。', 429);
        }
      }
      let success = false;
      try {
        const quota = await guard.fetch('https://budget/reserve', {
          method: 'POST', body: JSON.stringify({ id, ip: ipKey, pro: !!period }),
        });
        if (!quota.ok) return fail('QUOTA', '识别服务今日预算已用完，请稍后再试。不会扣除套餐次数。', 429);
        const output = await env.AI.run(env.MODEL, modelInput(body.image));
        const food = parseModelText(output, "scan-" + crypto.randomUUID());
        success = true;
        return send({ food });
      } finally {
        if (member) {
          const finalized = await memberCall('finish', requestId, success);
          if (!finalized.ok) throw new Error('ALLOWANCE_WRITE');
        }
      }
    } catch (e) {
      if (e instanceof LabelError) return fail("RETAKE", e.message, 422);
      const msg = e instanceof Error ? e.message : "";
      if (/quota|neuron|daily limit|exceeded/i.test(msg))
        return fail("QUOTA", "今天的识别额度已用完，请明天再试。", 429);
      return fail(
        "MODEL",
        "识别暂时没有完成，请重试或换一张清晰的标签照片。",
        503,
      );
    }
  },
};
