import { MONTHLY_PLAN, type SubscriptionPeriod } from '../../src/lib/membership-plan.ts';
export type BillingEnv = { BILLING_ENABLED?: string; REVENUECAT_SECRET_API_KEY?: string; ALLOW_SANDBOX_SUBSCRIPTIONS?: string };
export const billingAvailable = (env: BillingEnv) => env.BILLING_ENABLED === 'true' && !!env.REVENUECAT_SECRET_API_KEY;
type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : {};
export function subscriptionPeriod(value: unknown, allowSandbox = false, now = Date.now()): SubscriptionPeriod {
  const customer = record(record(value).subscriber);
  if (!customer.entitlements || !customer.subscriptions) throw new Error('SUBSCRIPTION_RESPONSE');
  const entitlement = record(record(customer.entitlements)[MONTHLY_PLAN.entitlement]);
  if (!Object.keys(entitlement).length) return null;
  if (entitlement.product_identifier !== MONTHLY_PLAN.product) throw new Error('SUBSCRIPTION_PRODUCT');
  const purchase = record(record(customer.subscriptions)[MONTHLY_PLAN.product]);
  if (!Object.keys(purchase).length) throw new Error('SUBSCRIPTION_RESPONSE');
  if (typeof purchase.is_sandbox !== 'boolean') throw new Error('SUBSCRIPTION_RESPONSE');
  if (purchase.refunded_at || purchase.store !== 'app_store' && purchase.store !== 'play_store' || purchase.is_sandbox === true && !allowSandbox) return null;
  const start = typeof purchase.purchase_date === 'string' ? Date.parse(purchase.purchase_date) : NaN;
  const expiry = typeof purchase.expires_date === 'string' ? Date.parse(purchase.expires_date) : NaN;
  const grace = typeof purchase.grace_period_expires_date === 'string' ? Date.parse(purchase.grace_period_expires_date) : NaN;
  if (!Number.isFinite(start) || !Number.isFinite(expiry) || start > now || expiry <= start || expiry - start > 35 * 86400000) throw new Error('SUBSCRIPTION_PERIOD');
  const transaction = purchase.store_transaction_id;
  if (!(typeof transaction === 'string' && transaction.length > 0 && transaction.length < 512 || typeof transaction === 'number' && Number.isSafeInteger(transaction) && transaction > 0)) throw new Error('SUBSCRIPTION_TRANSACTION');
  const entitlementExpiry = typeof entitlement.expires_date === 'string' ? Date.parse(entitlement.expires_date) : NaN;
  const entitlementGrace = typeof entitlement.grace_period_expires_date === 'string' ? Date.parse(entitlement.grace_period_expires_date) : NaN;
  if (!Number.isFinite(entitlementExpiry)) throw new Error('SUBSCRIPTION_RESPONSE');
  const endsAt = Math.min(Number.isFinite(grace) ? Math.max(expiry, grace) : expiry, Number.isFinite(entitlementGrace) ? Math.max(entitlementExpiry, entitlementGrace) : entitlementExpiry);
  return endsAt > now ? { key: new Date(start).toISOString(), endsAt, ledgerKey: purchase.store + ':' + transaction } : null;
}
export async function getSubscription(env: BillingEnv, id: string, fetcher = fetch): Promise<SubscriptionPeriod> {
  if (!billingAvailable(env)) return null;
  const response = await fetcher('https://api.revenuecat.com/v1/subscribers/' + encodeURIComponent(id), {
    headers: { Authorization: 'Bearer ' + env.REVENUECAT_SECRET_API_KEY, Accept: 'application/json' }, signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('SUBSCRIPTION_LOOKUP');
  return subscriptionPeriod(await response.json(), env.ALLOW_SANDBOX_SUBSCRIPTIONS === 'true');
}
