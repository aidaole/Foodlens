export const MONTHLY_PLAN = { name: 'FoodLens Pro', referencePriceCNY: 9.9, freeScans: 3, monthlyScans: 50, entitlement: 'pro', product: 'foodlens_pro_monthly' } as const;
export type SubscriptionPeriod = { key: string; endsAt: number; ledgerKey: string } | null;
export type ScanAllowance = { freeUsed: number; period: { key: string; used: number; endsAt: number } | null; pending: { id: string; period: string; until: number } | null };
export const emptyAllowance = (): ScanAllowance => ({ freeUsed: 0, period: null, pending: null });
function currentAllowance(state: ScanAllowance, period: SubscriptionPeriod, now: number): ScanAllowance {
  return { ...state, pending: state.pending && state.pending.until > now ? state.pending : null,
    period: period ? state.period?.key === period.key ? { ...state.period, endsAt: period.endsAt } : { key: period.key, endsAt: period.endsAt, used: 0 } : state.period };
}
export function allowanceStatus(state: ScanAllowance, period: SubscriptionPeriod, now = Date.now()) {
  const current = currentAllowance(state, period, now);
  const active = !!period && period.endsAt > now;
  const limit = active ? MONTHLY_PLAN.monthlyScans : MONTHLY_PLAN.freeScans;
  const used = active ? current.period?.used ?? 0 : current.freeUsed;
  const pending = current.pending?.period === (active ? period!.key : 'free') ? 1 : 0;
  return { active, limit, used, remaining: Math.max(0, limit - used - pending), endsAt: active ? period!.endsAt : null };
}
export function reserveScan(state: ScanAllowance, period: SubscriptionPeriod, id: string, now = Date.now()) {
  const current = currentAllowance(state, period, now);
  if (current.pending) return { ok: false as const, code: 'BUSY', state: current };
  const status = allowanceStatus(current, period, now);
  if (status.remaining === 0) return { ok: false as const, code: status.active ? 'MEMBER_QUOTA' : 'FREE_QUOTA', state: current };
  // One in-flight recognition per identity; expire abandoned reservations after 10 minutes.
  return { ok: true as const, state: { ...current, pending: { id, period: status.active ? period!.key : 'free', until: now + 600000 } } };
}
export function finishScan(state: ScanAllowance, id: string, success: boolean): ScanAllowance {
  if (state.pending?.id !== id) return state;
  const target = state.pending.period;
  return { ...state, pending: null, freeUsed: state.freeUsed + (success && target === 'free' ? 1 : 0),
    period: state.period && success && target === state.period.key ? { ...state.period, used: state.period.used + 1 } : state.period };
}
