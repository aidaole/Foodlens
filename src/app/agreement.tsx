import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, s, Icon, Button } from '../components/ui';
import { LegalLinks } from '../components/LegalLinks';
import { legalContent } from '../lib/legal';
import { useStore } from '../lib/store';
export default function Agreement() {
  const store = useStore();
  const [checked, setChecked] = useState(false);
  return <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom', 'left', 'right']}>
    <View style={{ flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center' }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 18 }} style={{ flex: 1 }}>
        <View style={{ width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: C.lime, marginTop: 12 }}><Icon name="shield" size={30} /></View>
        <Text style={[s.eyebrow, { marginTop: 24 }]}>BEFORE YOUR FIRST SCAN</Text>
        <Text style={[s.pageHeading, { marginTop: 12, fontSize: 30, lineHeight: 42 }]}>吃得明白，{"\n"}也用得安心。</Text>
        <Text style={[s.body, { marginTop: 16 }]}>拍照前，先了解标签解读的边界和照片的去向。完整说明可离线阅读，也可切换英文。</Text>
        {!legalContent.active && <Text style={[s.body, { fontSize: 13, color: '#8E633A', backgroundColor: '#F3EDD7', padding: 15, borderRadius: 14, marginTop: 18 }]}>当前为协议草案，运营主体和公开邮箱尚待确认。此处只记录阅读确认；正式版本启用时会重新提示。</Text>}
        <View style={[s.card, { marginTop: 22 }]}><LegalLinks /></View>
        <Text style={[s.small, { fontSize: 12, lineHeight: 21, marginTop: 16 }]}>同意用户协议不会启动订阅。照片发送至 Cloudflare Workers AI 前还会单独询问；未授权仍可体验示例。食刻不是医疗器械，食用前请核对原包装。</Text>
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingBottom: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.line }}>
        <Pressable accessibilityRole="checkbox" accessibilityLabel={legalContent.active ? '我同意用户协议并已了解隐私政策' : '我已阅读用户协议和隐私政策草案'} accessibilityState={{ checked }} onPress={() => setChecked(!checked)} style={[s.row, { alignItems: 'flex-start', paddingVertical: 12 }]}>
          <View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 1, borderColor: checked ? '#799740' : C.muted, backgroundColor: checked ? C.lime : C.paper, justifyContent: 'center', alignItems: 'center' }}>{checked && <Icon name="check" size={17} />}</View>
          <Text style={{ flex: 1, color: C.ink, fontSize: 13, lineHeight: 22 }}>{legalContent.active ? '我同意用户协议，并已了解隐私政策。' : '我已阅读用户协议和隐私政策草案。'}</Text>
        </Pressable>
        <Button disabled={!checked} onPress={() => store.acknowledgeLegal(legalContent.revision)} icon="arrow">{legalContent.active ? '同意并开始体验' : '确认阅读，开始体验'}</Button>
      </View>
    </View>
  </SafeAreaView>;
}
