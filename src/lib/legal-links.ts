export type LegalDocumentId = 'terms' | 'privacy' | 'support' | 'health' | 'subscription';
export type LegalLanguage = 'zh' | 'en';
const localDocuments: Record<string, LegalDocumentId> = { 'terms.html': 'terms', 'privacy.html': 'privacy', 'support.html': 'support', 'health.html': 'health', 'subscription.html': 'subscription' };
export function legalLinkTarget(href: string): { document: LegalDocumentId } | { url: string } | undefined {
  if (Object.prototype.hasOwnProperty.call(localDocuments, href)) return { document: localDocuments[href] };
  if (/^https:\/\/[^\s<>]+$/.test(href) || /^mailto:[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(href)) return { url: href };
  return undefined;
}
export function hasLegalAcknowledgment(ack: unknown, revision: string): boolean {
  if (!ack || typeof ack !== 'object') return false;
  const value = ack as { revision?: unknown; at?: unknown };
  return value.revision === revision && typeof value.at === 'string' && Number.isFinite(Date.parse(value.at));
}
