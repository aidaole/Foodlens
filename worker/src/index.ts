import { DurableObject } from "cloudflare:workers";
import type { Env } from "./handler.ts";
import { reserve, type Counter } from "./budget.ts";
export { default } from "./handler.ts";
export class RecognitionBudget extends DurableObject<Env> {
  async fetch(request: Request) {
    const p = (await request.json()) as { id: string; ip: string };
    const day = new Date().toISOString().slice(0, 10);
    const result = await this.ctx.storage.transaction(async (tx) => {
      const current = await tx.get<Counter>("counter");
      const next = reserve(
        current,
        day,
        p.id,
        p.ip,
        Math.max(1, Math.min(100, Number(this.env.DAILY_LIMIT) || 25)),
        Math.max(1, Math.min(30, Number(this.env.DEVICE_DAILY_LIMIT) || 8)),
      );
      if (next.ok) await tx.put("counter", next.state);
      return next.ok;
    });
    return Response.json({ ok: result }, { status: result ? 200 : 429 });
  }
}
