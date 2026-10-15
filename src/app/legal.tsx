import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { C, s, Icon } from '../components/ui';
import { legalContent, legalLabels, legalLinkTarget, type LegalDocumentId, type LegalLanguage } from '../lib/legal';
import { useStore } from '../lib/store';

export default function LegalScreen() {
  const params = useLocalSearchParams<{ doc?: string; lang?: string }>();
  const doc: LegalDocumentId = params.doc && Object.prototype.hasOwnProperty.call(legalLabels, params.doc) ? params.doc as LegalDocumentId : 'privacy';
  const lang: LegalLanguage = params.lang === 'en' ? 'en' : 'zh';
  const [linkError, setLinkError] = useState('');
  const scroll = useRef<ScrollView>(null);
  const store = useStore();
  const english = lang === 'en';
  function open(href: string) {
    const target = legalLinkTarget(href);
    if (!target) return;
    if ('document' in target) {
      setLinkError('');
      router.setParams({ doc: target.document, lang });
      scroll.current?.scrollTo({ y: 0, animated: false });
    } else void Linking.openURL(target.url).catch(() => setLinkError(english ? 'Unable to open this link. For email, set up a mail app first.' : '无法打开链接；邮箱链接需要先配置邮件应用。'));
  }
  function inline(text: string) {
    const nodes: React.ReactNode[] = [];
    let at = 0;
    for (const match of text.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
      nodes.push(text.slice(at, match.index));
      const [, label, href] = match;
      nodes.push(legalLinkTarget(href) ? <Text key={match.index} accessibilityRole="link" onPress={() => open(href)} style={{ color: '#42632B', textDecorationLine: 'underline' }}>{label}</Text> : label);
      at = match.index! + match[0].length;
    }
    nodes.push(text.slice(at));
    return nodes;
  }
  return <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom', 'left', 'right']}>
    <View style={{ width: '100%', maxWidth: 820, alignSelf: 'center', flex: 1 }}>
      <View style={[s.row, { paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={english ? 'Back' : '返回'} onPress={() => router.canGoBack() ? router.back() : router.replace(store.onboarded ? '/profile' : '/onboarding')} style={{ padding: 12 }}><Icon name="back" /></Pressable>
        <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: C.ink }}>{english ? 'FoodLens documents' : legalLabels[doc]}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={english ? '切换中文' : 'Switch to English'} onPress={() => { router.setParams({ lang: english ? 'zh' : 'en' }); scroll.current?.scrollTo({ y: 0, animated: false }); }} style={{ padding: 12 }}><Text style={{ color: '#42632B', fontWeight: '700' }}>{english ? '中文' : 'EN'}</Text></Pressable>
      </View>
      <ScrollView ref={scroll} key={`${doc}-${lang}`} style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Text style={s.eyebrow}>FOODLENS / {legalContent.active ? 'LEGAL' : 'DRAFT'}</Text>
        {!legalContent.active && <View style={{ padding: 16, marginTop: 16, borderRadius: 16, backgroundColor: '#F3EDD7' }}><Text style={{ color: C.ink, fontWeight: '700', marginBottom: 7 }}>{english ? 'Draft for review' : '上架准备草案'}</Text><Text style={[s.body, { fontSize: 13 }]}>{english ? 'Operator identity, contact addresses, launch markets and the effective date are pending confirmation. This is not an active policy or a store submission document.' : '运营主体、公开邮箱、首发地区和生效日期尚待确认。本页用于体验与核对，尚不是可提交商店的正式协议。'}</Text></View>}
        {legalContent.documents[doc][lang].map((block, index) => <Text selectable key={index} accessibilityRole={block.kind === 'paragraph' ? undefined : 'header'} style={block.kind === 'title' ? [s.pageHeading, { fontSize: 28, lineHeight: 38, marginTop: 22 }] : block.kind === 'heading' ? { color: C.ink, fontSize: 19, fontWeight: '700', lineHeight: 28, marginTop: 28, marginBottom: 5 } : [s.body, { fontSize: 15, lineHeight: 27, marginTop: 13 }]}>{inline(block.text)}</Text>)}
        {!!linkError && <Text style={{ color: '#A66042', marginTop: 16 }}>{linkError}</Text>}
        <Text style={[s.small, { marginTop: 30, fontSize: 11 }]}>{english ? 'Included with the app · available offline' : '随应用保存 · 可离线阅读'}</Text>
      </ScrollView>
    </View>
  </SafeAreaView>;
}
