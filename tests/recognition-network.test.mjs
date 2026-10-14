import test from "node:test";
import assert from "node:assert/strict";
import {requestJson, connectService, prepareWithinDeadline} from "../src/lib/recognition-network.ts";
const signal = () => new AbortController().signal;
const hangs = () => new Promise(() => {});
test("网络不响应或无视abort时，也能结束等待并报告连接超时", async () => {
  await assert.rejects(requestJson("https://test/health", {signal:signal(), timeoutMs:5, connection:true, fetcher:hangs}), e => e.code === "CONNECTION_TIMEOUT");
});
test("响应正文卡住也受时限控制，模型超时不冒充用户取消", async () => {
  let calls = 0;
  await assert.rejects(requestJson("https://test/v1/recognize", {signal:signal(), timeoutMs:5, body:{image:"jpeg"}, fetcher:async () => {calls++; return {ok:true,json:hangs};}}), e => e.code === "MODEL_TIMEOUT");
  assert.equal(calls, 1);
});
test("用户取消立即结束；已取消的请求不发送", async () => {
  const controller = new AbortController();
  const p = requestJson("https://test/health", {signal:controller.signal, timeoutMs:1000, fetcher:hangs});
  controller.abort();
  await assert.rejects(p, e => e.code === "CANCELED");
  let calls = 0;
  await assert.rejects(requestJson("https://test/health", {signal:controller.signal, timeoutMs:1000, fetcher:async () => {calls++;}}), e => e.code === "CANCELED");
  assert.equal(calls, 0);
});
test("连接探测短暂失败只重试一次，服务未准备则直接提示", async () => {
  let calls = 0;
  await connectService("https://test", signal(), async () => {if (++calls === 1) throw Error("disconnected"); return Response.json({ready:true});}, 20);
  assert.equal(calls, 2);
  calls = 0;
  await assert.rejects(connectService("https://test", signal(), async () => {calls++; return Response.json({ready:false});},20), e => e.code === "NOT_READY");
  assert.equal(calls, 1);
});
test("额度和重拍错误原样保留，不自动重发模型请求", async () => {
  for (const code of ["QUOTA", "RETAKE"]) {
    await assert.rejects(requestJson("https://test/v1/recognize", {signal:signal(),timeoutMs:30,body:{},fetcher:async () => Response.json({error:{code,message:"具体原因"}},{status:429})}), e => e.code === code && e.message === "具体原因");
  }
});
test("图片准备卡住和主动取消分开处理，成功准备正常返回", async () => {
  await assert.rejects(prepareWithinDeadline(hangs(),signal(),5), e => e.code === "IMAGE_TIMEOUT");
  assert.equal(await prepareWithinDeadline(Promise.resolve("jpeg"),signal(),20), "jpeg");
  const c = new AbortController(); const p = prepareWithinDeadline(hangs(),c.signal,1000); c.abort();
  await assert.rejects(p, e => e.code === "CANCELED");
});
