import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { C, s, Icon } from './ui';
import { legalLabels, type LegalDocumentId } from '../lib/legal';
export function LegalLinks({ compact = false, beforeOpen }: { compact?: boolean; beforeOpen?: () => void }) {
  const ids: LegalDocumentId[] = compact ? ['terms', 'privacy'] : ['terms', 'privacy', 'health', 'support'];
  return <View style={{ width: '100%', flexDirection: compact ? 'row' : 'column', flexWrap: compact ? 'wrap' : 'nowrap', gap: compact ? 6 : 0, justifyContent: compact ? 'center' : undefined }}>
    {ids.map(id => <Pressable key={id} accessibilityRole="button" onPress={() => { beforeOpen?.(); router.push({ pathname: '/legal', params: { doc: id } }); }} style={compact ? { paddingHorizontal: 6, paddingVertical: 9, minHeight: 36 } : { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.line, gap: 10 }}>
      {!compact && <Icon name={id === 'privacy' ? 'shield' : 'info'} size={19} />}
      <Text style={compact ? { color: '#42632B', fontSize: 12, textDecorationLine: 'underline' } : [s.body, { flex: 1, color: C.ink }]}>{legalLabels[id]}</Text>
      {!compact && <Icon name="arrow" size={16} />}
    </Pressable>)}
  </View>;
}
