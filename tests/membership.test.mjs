import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { emptyAllowance, allowanceStatus, reserveScan, finishScan, MONTHLY_PLAN } from '../src/lib/membership-plan.ts';
import { issueIdentity, verifyIdentity, issueSession } from '../worker/src/auth.ts';
import { subscriptionPeriod, getSubscription } from '../worker/src/membership.ts';
import handler from '../worker/src/handler.ts';
const now = Date.parse('2026-10-16T00:00:00Z');
const date = ms => new Date(ms).toISOString();
const receipt = (updates = {}) => ({ subscriber: { entitlements: { pro: { product_identifier: MONTHLY_PLAN.product, expires_date: date(now + 86400000), grace_period_expires_date: null } }, subscriptions: { [MONTHLY_PLAN.product]: { purchase_date: date(now - 29 * 86400000), expires_date: date(now + 86400000), grace_period_expires_date: null, store: 'play_store', store_transaction_id: 'GPA.test.0', is_sandbox: false, refunded_at: null, ...updates } } } });
test('3 total free recognitions: failed/retake releases, success commits once, concurrent and 4th request rejected', () => {
  let state = emptyAllowance();
  const first = reserveScan(state, null, 'first', now);
  assert.equal(first.ok, true); state = first.state;
  assert.equal(reserveScan(state, null, 'concurrent', now).code, 'BUSY');
  state = finishScan(state, 'first', false); assert.equal(allowanceStatus(state, null, now).remaining, 3);
  for (let i = 0; i < 3; i++) { state = reserveScan(state, null, String(i), now).state; state = finishScan(state, String(i), true); state = finishScan(state, String(i), true); }
  assert.equal(state.freeUsed, 3); assert.equal(reserveScan(state, null, 'fourth', now + 50 * 86400000).code, 'FREE_QUOTA');
});
test('50 scans per verified renewal, no refresh/grace reset, no spending free scans, safe expiry of abandoned requests', () => {
  const period = subscriptionPeriod(receipt(), false, now); let state = { ...emptyAllowance(), freeUsed: 3 };
  for (let i = 0; i < 50; i++) { state = reserveScan(state, period, String(i), now).state; state = finishScan(state, String(i), true); }
  assert.equal(state.freeUsed, 3); assert.equal(reserveScan(state, period, '51', now).code, 'MEMBER_QUOTA');
  assert.equal(allowanceStatus(state, { ...period, endsAt: period.endsAt + 86400000 }, now).remaining, 0);
  const renewal = { ...period, key: date(now + 86400000), endsAt: now + 31 * 86400000, ledgerKey: 'play_store:GPA.test.1' };
  assert.equal(allowanceStatus(state, renewal, now + 86400000).remaining, 50);
  assert.equal(allowanceStatus(state, period, period.endsAt).remaining, 0);
  const abandoned = reserveScan(emptyAllowance(), null, 'old', now).state;
  assert.equal(reserveScan(abandoned, null, 'new', now + 600001).ok, true);
  assert.equal(finishScan(abandoned, 'different', true), abandoned);
});
test('server uses store transaction for restoration identity; sandbox, refunded and expired receipts cannot grant paid access', async () => {
  const first = receipt(); const restored = structuredClone(first); restored.subscriber.original_app_user_id = 'different-installation';
  assert.equal(subscriptionPeriod(first, false, now).ledgerKey, subscriptionPeriod(restored, false, now).ledgerKey);
  assert.equal(subscriptionPeriod(receipt({ refunded_at: date(now) }), false, now), null);
  assert.equal(subscriptionPeriod(receipt({ is_sandbox: true }), false, now), null);
  assert.ok(subscriptionPeriod(receipt({ is_sandbox: true }), true, now));
  assert.equal(subscriptionPeriod(first, false, now + 86400000), null);
  assert.throws(() => subscriptionPeriod(receipt({ expires_date: date(now + 365 * 86400000) }), false, now));
  assert.throws(() => subscriptionPeriod({ subscriber: { entitlements: { pro: {} } } }, false, now));
  await assert.rejects(getSubscription({ BILLING_ENABLED: 'true', REVENUECAT_SECRET_API_KEY: 'test-secret' }, 'id', async () => new Response('', { status: 503 })));
  let calls = 0; assert.equal(await getSubscription({ BILLING_ENABLED: 'false' }, 'id', async () => { calls++; }), null); assert.equal(calls, 0);
});
test('signed installation credential cannot be chosen, forged, or substituted by short-lived legacy session', async () => {
  const secret = 'test-only-secret-at-least-32-characters'; const owner = await issueIdentity(secret);
  assert.equal(await verifyIdentity(secret, owner.token), owner.id);
  assert.equal(await verifyIdentity(secret, owner.token + 'tampered'), null);
  assert.equal(await verifyIdentity(secret, (await issueSession(secret)).token), null);
  assert.equal(await verifyIdentity(secret + '-other', owner.token), null);
});
test('HTTP quota enforcement happens before model/global spending; failed labels release allowance and invented Pro flags fail', async () => {
  const states = new Map(); let modelCalls = 0; let budgetCalls = 0; let failModel = true;
  const label = JSON.parse(readFileSync(new URL('./fixtures/label.json', import.meta.url)));
  const env = { SESSION_SECRET: 'test-only-secret-at-least-32-characters', MODEL_ENABLED: 'true', BILLING_ENABLED: 'false', MODEL: 'test', ALLOWED_ORIGINS: '', REQUEST_LIMITER: { limit: async () => ({ success: true }) },
    AI: { run: async () => { modelCalls++; if (failModel) throw new Error('test model failure'); return { response: JSON.stringify(label) }; } },
    BUDGET: { idFromName: name => name, get: name => ({ fetch: async (url, options) => {
      if (name === 'foodlens-global') { budgetCalls++; return Response.json({ ok: true }); }
      const p = JSON.parse(options.body); const state = states.get(name) ?? emptyAllowance();
      if (p.action === 'status') return Response.json(allowanceStatus(state, p.period));
      if (p.action === 'finish') { states.set(name, finishScan(state, p.requestId, p.success)); return Response.json({ ok: true }); }
      const next = reserveScan(state, p.period, p.requestId); states.set(name, next.state);
      return Response.json({ ok: next.ok, code: next.code }, { status: next.ok ? 200 : 429 });
    } }) } };
  const request = (path, token, body) => new Request('https://foodlens.test' + path, { method: body === undefined ? 'GET' : 'POST', headers: { 'CF-Connecting-IP': '192.0.2.1', 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const owner = await (await handler.fetch(request('/v2/identity', undefined, { id: 'invented' }), env)).json();
  assert.notEqual(owner.id, 'invented');
  const photo = { image: 'data:image/jpeg;base64,' + Buffer.concat([Buffer.from([255, 216, 255]), Buffer.alloc(200)]).toString('base64'), pro: true };
  assert.equal((await handler.fetch(request('/v2/recognize', owner.token, photo), env)).status, 503);
  assert.equal((await (await handler.fetch(request('/v2/membership', owner.token), env)).json()).remaining, 3);
  failModel = false;
  for (let i = 0; i < 3; i++) assert.equal((await handler.fetch(request('/v2/recognize', owner.token, photo), env)).status, 200);
  const rejected = await handler.fetch(request('/v2/recognize', owner.token, photo), env);
  assert.equal((await rejected.json()).error.code, 'FREE_QUOTA');
  assert.equal(modelCalls, 4); assert.equal(budgetCalls, 4);
  assert.equal((await handler.fetch(request('/v2/membership', 'not-a-credential'), env)).status, 401);
  assert.equal((await handler.fetch(request('/v1/session', undefined, {}), { ...env, BILLING_ENABLED: 'true' })).status, 410);
});
