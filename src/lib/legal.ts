import bundle from '../content/legal-documents.json';
export { legalLinkTarget, hasLegalAcknowledgment } from './legal-links';
export type { LegalDocumentId, LegalLanguage } from './legal-links';
export const legalContent = bundle;
export const legalLabels = { terms: '用户协议', privacy: '隐私政策', support: '帮助与支持', health: '健康信息说明' };
