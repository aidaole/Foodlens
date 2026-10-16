import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { PurchasesPackage } from 'react-native-purchases';
import { MONTHLY_PLAN } from './membership-plan';
import { requestJson, RecognitionError, CONNECTION_TIMEOUT_MS } from './recognition-network';
import { legalContent } from './legal';
const endpoint = (process.env.EXPO_PUBLIC_RECOGNITION_URL ?? '').replace(/\/$/, '');
const IDENTITY_KEY = 'foodlens.installation.v1';
type Identity = { id: string; token: string };
let identity: Promise<Identity> | undefined;
export type MembershipStatus = { active: boolean; limit: number; used: number; remaining: number; endsAt: number | null; billingAvailable: boolean };
export async function getIdentity(signal: AbortSignal): Promise<Identity> {
  if (!identity) identity = (async () => {
    const raw = Platform.OS === 'web' ? await AsyncStorage.getItem(IDENTITY_KEY) : await SecureStore.getItemAsync(IDENTITY_KEY);
    if (raw) {
      try {
        const stored = JSON.parse(raw) as Identity;
        if (/^[0-9a-f-]{36}$/.test(stored.id) && typeof stored.token === 'string' && stored.token.startsWith(stored.id + '.')) return stored;
      } catch { /* Invalid credentials require support, not a new free allowance. */ }
      throw new RecognitionError('体验身份无法读取，请联系支持。', 'IDENTITY');
    }
    const next = await requestJson(endpoint + '/v2/identity', { signal, connection: true, timeoutMs: CONNECTION_TIMEOUT_MS, body: {} });
    if (typeof next?.id !== 'string' || typeof next?.token !== 'string' || !/^[0-9a-f-]{36}$/.test(next.id) || !next.token.startsWith(next.id + '.')) throw new RecognitionError('未能建立使用身份，请稍后重试。', 'IDENTITY');
    const value: Identity = { id: next.id, token: next.token };
    try {
      if (Platform.OS === 'web') await AsyncStorage.setItem(IDENTITY_KEY, JSON.stringify(value));
      else await SecureStore.setItemAsync(IDENTITY_KEY, JSON.stringify(value));
    } catch { throw new RecognitionError('无法保存体验身份，请检查设备存储后重试。', 'IDENTITY'); }
    return value;
  })().catch(error => { identity = undefined; throw error; });
  return identity;
}
export async function getMembership(signal: AbortSignal): Promise<MembershipStatus> {
  const owner = await getIdentity(signal);
  const status = await requestJson(endpoint + '/v2/membership', { signal, token: owner.token, timeoutMs: CONNECTION_TIMEOUT_MS, connection: true });
  if (typeof status.active !== 'boolean' || typeof status.billingAvailable !== 'boolean' || !Number.isInteger(status.used) || status.used < 0 || !Number.isInteger(status.remaining) || status.remaining < 0 || status.remaining > status.limit || status.limit !== (status.active ? MONTHLY_PLAN.monthlyScans : MONTHLY_PLAN.freeScans) || status.active && (!Number.isFinite(status.endsAt) || status.endsAt <= Date.now())) throw new RecognitionError('会员状态暂时无法读取，请稍后重试。', 'SUBSCRIPTION_SERVICE');
  return status;
}
const platformKey = Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY : Platform.OS === 'android' ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY : undefined;
export const nativeBillingConfigured = !!platformKey && process.env.EXPO_PUBLIC_BILLING_ENABLED === 'true' && (Platform.OS === 'ios' || Platform.OS === 'android');
let initialized: Promise<typeof import('react-native-purchases')['default']> | undefined;
async function purchases(signal: AbortSignal) {
  if (!nativeBillingConfigured) throw new Error('此体验版尚未开放购买。');
  if (!initialized) initialized = (async () => {
    const owner = await getIdentity(signal);
    const sdk = (await import('react-native-purchases')).default;
    sdk.configure({ apiKey: platformKey!, appUserID: owner.id });
    return sdk;
  })().catch(error => { initialized = undefined; throw error; });
  return initialized;
}
export async function monthlyPackage(signal: AbortSignal): Promise<PurchasesPackage | null> {
  if (!nativeBillingConfigured || !legalContent.active) return null;
  const sdk = await purchases(signal);
  const offer = (await sdk.getOfferings()).current?.monthly;
  if (!offer || offer.product.subscriptionPeriod !== 'P1M' || offer.product.identifier.split(':')[0] !== MONTHLY_PLAN.product) throw new Error('月会员商品暂时不可用，请稍后重试。');
  return offer;
}
export async function buyMonthly(offer: PurchasesPackage, signal: AbortSignal) {
  if (!legalContent.active) throw new Error('订阅尚未开放。');
  const before = await getMembership(signal);
  if (!before.billingAvailable) throw new Error('订阅尚未开放。');
  if (before.active) return before;
  const sdk = await purchases(signal);
  const current = await monthlyPackage(signal);
  if (!current || current.identifier !== offer.identifier || current.product.identifier !== offer.product.identifier || current.product.priceString !== offer.product.priceString) throw new Error('商品价格已更新，请刷新后确认。');
  await sdk.purchasePackage(current);
  try { return await getMembership(signal); }
  catch { throw new RecognitionError('商店付款已提交，但会员确认暂时未完成。请刷新或恢复购买，不要重复购买。', 'PAYMENT_CONFIRMATION'); }
}
export async function restoreMembership(signal: AbortSignal) {
  const sdk = await purchases(signal);
  await sdk.restorePurchases();
  return getMembership(signal);
}
export function manageMembership() {
  return Linking.openURL(Platform.OS === 'ios' ? 'https://apps.apple.com/account/subscriptions' : 'https://play.google.com/store/account/subscriptions');
}
