import { DurableObject } from "cloudflare:workers";
import type { Env } from "./handler.ts";
import { reserve, type Counter } from "./budget.ts";
import { emptyAllowance, allowanceStatus, reserveScan, finishScan, type ScanAllowance, type SubscriptionPeriod } from '../../src/lib/membership-plan.ts';
export { default } from "./handler.ts";
export class RecognitionBudget extends DurableObject<Env> {
  async fetch(request: Request) {
    if (new URL(request.url).pathname.startsWith('/member/')) {
      const body = await request.json() as { action: 'status' | 'reserve' | 'finish'; period: SubscriptionPeriod; requestId: string; success: boolean };
      return this.ctx.storage.transaction(async tx => {
        const state = await tx.get<ScanAllowance>('allowance') ?? emptyAllowance();
        if (body.action === 'status') return Response.json(allowanceStatus(state, body.period));
        if (body.action === 'finish') {
          await tx.put('allowance', finishScan(state, body.requestId, body.success));
          return Response.json({ ok: true });
        }
        const next = reserveScan(state, body.period, body.requestId);
        await tx.put('allowance', next.state);
        return Response.json({ ok: next.ok, code: next.ok ? undefined : next.code }, { status: next.ok ? 200 : 429 });
      });
    }
    const p = (await request.json()) as { id: string; ip: string; pro?: boolean };
    const day = new Date().toISOString().slice(0, 10);
    const result = await this.ctx.storage.transaction(async (tx) => {
      const current = await tx.get<Counter>("counter");
      const next = reserve(
        current,
        day,
        p.id,
        p.ip,
        Math.max(1, Math.min(100, Number(this.env.DAILY_LIMIT) || 25)),
        p.pro ? 100 : Math.max(1, Math.min(30, Number(this.env.DEVICE_DAILY_LIMIT) || 8)),
      );
      if (next.ok) await tx.put("counter", next.state);
      return next.ok;
    });
    return Response.json({ ok: result }, { status: result ? 200 : 429 });
  }
}
