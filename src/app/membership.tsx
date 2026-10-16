import React, { useState, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import type { PurchasesPackage } from 'react-native-purchases';
import { Shell, C, s, Icon, Button, SectionTitle } from '../components/ui';
import { getMembership, monthlyPackage, buyMonthly, restoreMembership, manageMembership, nativeBillingConfigured, type MembershipStatus } from '../lib/membership';
import { MONTHLY_PLAN } from '../lib/membership-plan';
import { LegalLinks } from '../components/LegalLinks';
export default function Membership() {
  const [status, setStatus] = useState<MembershipStatus | null>(null);
  const [offer, setOffer] = useState<PurchasesPackage | null>(null);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  const request = useRef<AbortController | null>(null);
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const refresh = React.useCallback(async () => {
    request.current?.abort();
    const abort = new AbortController(); request.current = abort;
    setBusy(true); setMessage(''); setOffer(null);
    try {
      const next = await getMembership(abort.signal);
      if (!abort.signal.aborted) { setStatus(next); if (next.active) setAwaitingPayment(false); }
      if (next.billingAvailable) {
        const product = await monthlyPackage(abort.signal);
        if (!abort.signal.aborted) setOffer(product);
      }
    } catch (error) { if (!abort.signal.aborted) setMessage(error instanceof Error ? error.message : '会员状态暂时无法读取。'); }
    finally { if (!abort.signal.aborted) setBusy(false); }
  }, []);
  useFocusEffect(React.useCallback(() => { void refresh(); return () => request.current?.abort(); }, [refresh]));
  async function transact(restore: boolean) {
    if (busy || !restore && !offer) return;
    setBusy(true); setMessage('');
    try {
      const next = restore ? await restoreMembership(new AbortController().signal) : await buyMonthly(offer!, new AbortController().signal);
      setStatus(next);
      setAwaitingPayment(!restore && !next.active);
      setMessage(next.active ? restore ? '已恢复月会员。' : '月会员已生效。' : restore ? '未找到有效订阅，请确认使用购买时的商店账号。' : '付款状态正在核实，请稍后刷新；不要重复购买。');
    } catch (error) {
      const e = error as { userCancelled?: boolean; code?: string; message?: string };
      if (e.code === 'PAYMENT_CONFIRMATION' || e.code === '20') setAwaitingPayment(true);
      setMessage(e.userCancelled ? '已取消购买。' : e.code === '20' ? '付款正在等待商店确认，暂未开通会员。' : e.message || '商店暂时无法完成操作，请稍后重试。');
    } finally { setBusy(false); }
  }
  return <Shell title="我的会员">
    <Text style={s.eyebrow}>FOODLENS PRO / MONTHLY</Text>
    <Text style={s.pageHeading}>每个月，多一点明白。</Text>
    <Text style={[s.body, { marginTop: 10 }]}>从一张食品标签开始，留意脂肪、配料和营养。</Text>
    <View style={[s.card, { marginTop: 24, backgroundColor: C.dark, borderColor: C.dark }]}>
      <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={{ color: C.paper, fontSize: 22, fontWeight: '700' }}>{MONTHLY_PLAN.name}</Text><Icon name="scan" color={C.lime} size={30} /></View>
      <Text style={{ color: C.lime, fontSize: 38, fontWeight: '700', marginTop: 22 }}>{offer ? offer.product.priceString : '¥9.90'}<Text style={{ fontSize: 16, color: '#C0CDB4' }}> / 月</Text></Text>
      <Text style={{ color: C.paper, fontSize: 17, lineHeight: 26, marginTop: 16 }}>每个订阅周期 {MONTHLY_PLAN.monthlyScans} 次真实标签识别</Text>
      <Text style={{ color: '#C0CDB4', fontSize: 13, lineHeight: 23, marginTop: 12 }}>配料与营养读取 · 脂肪重点解读 · 本地照片记录</Text>
      {!offer && <Text style={{ color: '#C0CDB4', fontSize: 12, lineHeight: 21, marginTop: 12 }}>方案参考价为人民币 ¥9.90。海外以商店显示的当地货币价格为准。</Text>}
    </View>
    <View style={[s.card, { marginTop: 20 }]}>
      <SectionTitle title={status?.active ? '本期会员额度' : '免费体验'} />
      <Text style={[s.heading, { fontSize: 25 }]}>{status ? `${status.remaining} / ${status.limit} 次` : busy ? '正在读取额度…' : '暂时无法读取额度'}</Text>
      <Text style={[s.body, { fontSize: 13, marginTop: 10 }]}>{status?.active && status.endsAt ? `会员有效至 ${new Date(status.endsAt).toLocaleDateString()}。下一次成功续订后重置为 50 次。` : '免费体验累计 3 次，不按月重置。示例分析不消耗次数。'}</Text>
      <Text style={[s.small, { fontSize: 12, lineHeight: 21, marginTop: 10 }]}>套餐次数以后台成功完成识别为准；失败或要求重拍不扣次。清除本地记录不重置额度。照片已发出后，即使断网或退出，后台成功完成也可能计次。</Text>
    </View>
    <View style={{ gap: 12, marginTop: 22 }}>
      {status?.active ? <Button icon="settings" onPress={() => void manageMembership().catch(() => setMessage('无法打开商店，请在商店账号的订阅设置中管理。'))}>管理订阅</Button> : <Button tone="lime" disabled={busy || awaitingPayment || !offer || !status?.billingAvailable} onPress={() => void transact(false)}>{busy ? '正在读取…' : awaitingPayment ? '等待付款确认' : offer ? '开通月会员' : '订阅即将开放'}</Button>}
      {!status?.billingAvailable && <Text style={[s.small, { textAlign: 'center', fontSize: 12, lineHeight: 21 }]}>当前体验版尚未开放购买，不会扣款。</Text>}
      {nativeBillingConfigured && <Button tone="light" icon="clock" disabled={busy} onPress={() => void transact(true)}>恢复购买</Button>}
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => void refresh()} style={{ padding: 12 }}><Text style={{ textAlign: 'center', color: '#42632B', fontSize: 13 }}>刷新会员与额度</Text></Pressable>
      {!!message && <Text accessibilityRole="alert" style={[s.body, { color: '#A66042', fontSize: 13 }]}>{message}</Text>}
    </View>
    <View style={[s.card, { marginTop: 20 }]}>
      <SectionTitle title="订阅前，先了解这些" />
      <Text style={[s.body, { fontSize: 13 }]}>月会员由 Apple 或 Google 商店自动续订，可在商店取消。每期 50 次，未使用次数不结转；取消通常不影响已付费周期。卸载应用或清除记录不会取消订阅。会员不代表识别更准确，也不提供医疗建议。</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/legal', params: { doc: 'subscription' } })} style={{ paddingVertical: 16 }}><Text style={{ color: '#42632B', fontSize: 14, textDecorationLine: 'underline' }}>月会员订阅条款</Text></Pressable>
      <LegalLinks compact />
    </View>
  </Shell>;
}
