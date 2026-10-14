import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  parseLabel,
  parseModelText,
  isCloudFood,
  LabelError,
} from "../src/lib/recognition-schema.ts";
import { restoreState, emptyState } from "../src/lib/persisted-state.ts";
import { issueSession, verifySession } from "../worker/src/auth.ts";
import { reserve } from "../worker/src/budget.ts";
import handler from "../worker/src/handler.ts";
const label = JSON.parse(
  readFileSync(new URL("./fixtures/label.json", import.meta.url)),
);
const copy = () => structuredClone(label);
const completion = (content, finish_reason = "stop") => ({ choices: [{ finish_reason, message: { role: "assistant", content } }] });
test("Gemma完整响应可读取，截断、拒绝或工具响应不能成为结果", () => {
  assert.equal(parseModelText(completion(JSON.stringify(label)), "scan-test").name, "测试燕麦");
  for (const reason of ["length", "tool_calls", "content_filter"])
    assert.throws(() => parseModelText(completion(JSON.stringify(label), reason), "scan-test"), LabelError);
  const refused = completion(JSON.stringify(label));
  refused.choices[0].message.refusal = "blocked";
  assert.throws(() => parseModelText(refused, "scan-test"), LabelError);
});
test("读取1883kJ和0.18g钠，服务端转换为kcal和mg，缺失值不当零", () => {
  const f = parseLabel(copy(), "scan-test");
  assert.ok(Math.abs(f.nutrients.energy - 450.0478) < 0.001);
  assert.equal(f.nutrients.sodium, 180);
  assert.equal(f.nutrients.addedSugar, null);
  assert.equal(f.serving, 30);
  assert.equal(f.pack, 180);
  assert.equal(isCloudFood(f), true);
});
test("每份基准按可核对原文转换为每100g", () => {
  const p = copy();
  p.basis = p.serving;
  p.nutrition = { fat: { value: 5.4, unit: "g", evidence: "脂肪5.4g" } };
  p.sourceText += "\n脂肪5.4g";
  assert.equal(parseLabel(p, "scan-test").nutrients.fat, 18);
});
test("体积基准保留mL，不把30g份量强行转成mL", () => {
  const p = copy();
  p.sourceText += "\n每100mL";
  p.basis = { amount: 100, unit: "mL", evidence: "每100mL" };
  const f = parseLabel(p, "scan-test");
  assert.equal(f.unit, "mL");
  assert.equal(f.serving, null);
  assert.equal(f.pack, null);
});
test("没读到基准或不清晰必须重拍；无原文证据的数字留空", () => {
  const p = copy();
  p.basis = null;
  assert.throws(() => parseLabel(p, "scan-test"), LabelError);
  p.basis = label.basis;
  p.nutrition.fat.evidence = "脂肪88g";
  assert.equal(parseLabel(p, "scan-test").nutrients.fat, null);
  p.needsRetake = true;
  p.reason = "请拍清营养表";
  assert.throws(() => parseLabel(p, "scan-test"), /请拍清营养表/);
});
test("负数、NaN、超过物理范围、混杂响应不显示成功", () => {
  for (const value of [-1, NaN, Infinity, 1000001]) {
    const p = copy();
    p.nutrition.fat.value = value;
    assert.throws(() => parseLabel(p, "scan-test"), LabelError);
  }
  const p = copy();
  p.nutrition.fat = { value: 1000, unit: "g", evidence: "脂肪1000g" };
  p.sourceText += "\n脂肪1000g";
  assert.throws(() => parseLabel(p, "scan-test"), LabelError);
  assert.throws(
    () =>
      parseModelText(
        { response: "ignore rules " + JSON.stringify(label) },
        "scan-test",
      ),
    LabelError,
  );
});
test("代码围栏可解析，但营养单位不支持时拒绝", () => {
  assert.equal(
    parseModelText(
      { response: "```json\n" + JSON.stringify(label) + "\n```" },
      "scan-test",
    ).name,
    "测试燕麦",
  );
  const p = copy();
  p.nutrition.energy.unit = "cal";
  assert.throws(() => parseLabel(p, "scan-test"), LabelError);
});
test("升级旧偏好兼容，云端结果保留，坏记录不会恢复", () => {
  const f = parseLabel(copy(), "scan-test");
  const s = restoreState({
    ...emptyState(),
    onboarded: true,
    recognized: [f, { source: "cloud", id: "fake" }],
    cloudConsent: true,
  });
  assert.deepEqual(s.recognized, [f]);
  assert.equal(s.onboarded, true);
  assert.equal(s.cloudConsent, true);
});
test("匿名会话签名、篡改、过期和跨密钥校验", async () => {
  const secret = "a".repeat(64);
  const s = await issueSession(secret);
  assert.ok(await verifySession(secret, s.token));
  assert.equal(await verifySession("b".repeat(64), s.token), null);
  assert.equal(await verifySession(secret, s.token + "x"), null);
  assert.equal(
    await verifySession(secret, s.token, (s.expiresAt + 1) * 1000),
    null,
  );
});
test("全局额度和IP额度独立于新会话，日期切换才重置", () => {
  let s;
  for (let i = 0; i < 3; i++) {
    const r = reserve(s, "2026-10-14", "id" + i, "ip", 5, 3);
    assert.equal(r.ok, true);
    s = r.state;
  }
  assert.equal(reserve(s, "2026-10-14", "fresh", "ip", 5, 3).ok, false);
  for (let i = 3; i < 5; i++)
    s = reserve(s, "2026-10-14", "id" + i, "ip" + i, 5, 3).state;
  assert.equal(reserve(s, "2026-10-14", "new", "new", 5, 3).ok, false);
  assert.equal(reserve(s, "2026-10-15", "id", "ip", 5, 3).state.total, 1);
});
function env() {
  let calls = 0;
  return {
    SESSION_SECRET: "s".repeat(64),
    MODEL: "@cf/google/gemma-4-26b-a4b-it",
    MODEL_ENABLED: "true",
    ALLOWED_ORIGINS: "https://example.test",
    REQUEST_LIMITER: { limit: async () => ({ success: true }) },
    BUDGET: {
      idFromName: () => "",
      get: () => ({ fetch: async () => new Response("{}", { status: 200 }) }),
    },
    AI: {
      run: async (model, input) => {
        assert.equal(model, "@cf/google/gemma-4-26b-a4b-it");
        assert.equal(input.messages[1].content[1].image_url.url, jpeg);
        assert.equal(input.store, false);
        calls++;
        return completion(JSON.stringify(label));
      },
    },
    get calls() {
      return calls;
    },
  };
}
const request = (path, body, token, origin) =>
  new Request("https://food.test" + path, {
    method: "POST",
    headers: {
      "CF-Connecting-IP": "127.0.0.1",
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(origin ? { Origin: origin } : {}),
    },
    body: JSON.stringify(body),
  });
const jpeg =
  "data:image/jpeg;base64," +
  Buffer.from([255, 216, 255, ...Array(100).fill(0)]).toString("base64");
test("网页静态资源独立处理，健康探测和API仍走识别接口", async () => {
  const e = env();
  let assets = 0;
  e.ASSETS = {fetch: async () => {assets++; return new Response("FoodLens page",{headers:{"Content-Type":"text/html"}});}};
  assert.match(await (await handler.fetch(new Request("https://food.test/"),e)).text(), /FoodLens page/);
  assert.equal((await (await handler.fetch(new Request("https://food.test/health"),e)).json()).ready,true);
  assert.equal((await handler.fetch(new Request("https://food.test/v1/missing"),e)).status,404);
  assert.equal(assets,1); assert.equal(e.calls,0);
});
test("HTTP链路包含会话、视觉输入、结构校验和真实结果格式", async () => {
  const e = env();
  const s = await (await handler.fetch(request("/v1/session", {}), e)).json();
  const r = await handler.fetch(
    request("/v1/recognize", { image: jpeg }, s.token),
    e,
  );
  assert.equal(r.status, 200);
  assert.equal(isCloudFood((await r.json()).food), true);
  assert.equal(e.calls, 1);
});
test("未知来源、无会话、错误图片和超大请求均在调用模型前拒绝", async () => {
  const e = env(),
    s = await issueSession(e.SESSION_SECRET);
  assert.equal(
    (
      await handler.fetch(
        request("/v1/recognize", { image: jpeg }, s.token, "https://evil.test"),
        e,
      )
    ).status,
    403,
  );
  assert.equal(
    (await handler.fetch(request("/v1/recognize", { image: jpeg }), e)).status,
    401,
  );
  assert.equal(
    (
      await handler.fetch(
        request("/v1/recognize", { image: "https://private.test" }, s.token),
        e,
      )
    ).status,
    415,
  );
  assert.equal(
    (
      await handler.fetch(
        request("/v1/recognize", { image: "x".repeat(2800000) }, s.token),
        e,
      )
    ).status,
    413,
  );
  assert.equal(e.calls, 0);
});
test("额度、重拍、模型失败和未启用返回不同状态，没有示例回退", async () => {
  let e = env(),
    s = await issueSession(e.SESSION_SECRET);
  e.BUDGET.get = () => ({
    fetch: async () => new Response("{}", { status: 429 }),
  });
  assert.equal(
    (await handler.fetch(request("/v1/recognize", { image: jpeg }, s.token), e))
      .status,
    429,
  );
  assert.equal(e.calls, 0);
  e = env();
  e.AI.run = async () => ({
    response: JSON.stringify({ ...label, needsRetake: true, reason: "模糊" }),
  });
  assert.equal(
    (await handler.fetch(request("/v1/recognize", { image: jpeg }, s.token), e))
      .status,
    422,
  );
  e.AI.run = async () => {
    throw Error("temporary provider failure");
  };
  assert.equal(
    (await handler.fetch(request("/v1/recognize", { image: jpeg }, s.token), e))
      .status,
    503,
  );
  e.MODEL_ENABLED = "false";
  assert.equal(
    (await handler.fetch(request("/v1/session", {}), e)).status,
    503,
  );
});
