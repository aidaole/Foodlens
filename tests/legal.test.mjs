import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createLegalBundle, missingOperatorFields } from '../scripts/legal-content.mjs';
import { hasLegalAcknowledgment, legalLinkTarget } from '../src/lib/legal-links.ts';
import { emptyState, restoreState, revokeCloudConsent } from '../src/lib/persisted-state.ts';
const configured = { operatorName: 'Test Operator', privacyEmail: 'privacy@example.com', supportEmail: 'support@example.com', effectiveDate: '2026-10-15', launchMarkets: ['US'], publicationReady: true };
test('offline documents include full bilingual text and regenerated content matches the source', async () => {
  const config = JSON.parse(await readFile(new URL('../docs/legal/operator.json', import.meta.url)));
  const stored = JSON.parse(await readFile(new URL('../src/content/legal-documents.json', import.meta.url)));
  assert.deepEqual(stored, await createLegalBundle(config));
  for (const doc of ['terms', 'privacy', 'support', 'health']) for (const lang of ['zh', 'en']) {
    const text = stored.documents[doc][lang].map(x => x.text).join('\n');
    assert.ok(text.length > 500); assert.ok(!text.includes('{{'));
  }
});
test('drafts cannot masquerade as active policies, and activation invalidates a draft acknowledgment', async () => {
  const draft = await createLegalBundle({ ...configured, privacyEmail: '' });
  const active = await createLegalBundle(configured);
  assert.equal(draft.active, false); assert.equal(draft.privacyEmail, ''); assert.equal(active.active, true);
  assert.notEqual(draft.revision, active.revision);
  const ack = { revision: draft.revision, at: '2026-10-15T00:00:00.000Z' };
  assert.equal(hasLegalAcknowledgment(ack, draft.revision), true);
  assert.equal(hasLegalAcknowledgment(ack, active.revision), false);
  assert.ok(missingOperatorFields({ ...configured, effectiveDate: '2026-02-30' }).includes('effectiveDate'));
  assert.ok(missingOperatorFields({ ...configured, publicationReady: false }).includes('publicationReady'));
  assert.equal(hasLegalAcknowledgment({ ...ack, at: 'invalid' }, draft.revision), false);
});
test('legacy installs retain their data but require a new acknowledgment; restoration validates acknowledgment', () => {
  const old = { profile: { concerns: ['血糖管理'], allergies: ['乳'] }, history: [{ id: 'old', foodId: 'oat', date: '2026-10-14' }], saved: ['oat'], onboarded: true, cloudConsent: true };
  const restored = restoreState(old);
  assert.deepEqual(restored.profile, old.profile); assert.deepEqual(restored.history, old.history);
  assert.equal(restored.cloudConsent, true); assert.equal(restored.legalAcceptance, null);
  const ack = { revision: 'revision', at: '2026-10-15T00:00:00Z' };
  assert.deepEqual(restoreState({ ...restored, legalAcceptance: ack }).legalAcceptance, ack);
  assert.equal(restoreState({ ...restored, legalAcceptance: { ...ack, at: 'bad' } }).legalAcceptance, null);
});
test('revoking future photo consent retains history, preferences, and agreement acknowledgment', () => {
  const state = { ...emptyState(), cloudConsent: true, history: [{ id: 'old', foodId: 'oat', date: '2026-10-14' }], legalAcceptance: { revision: 'r', at: '2026-10-15' } };
  assert.deepEqual(revokeCloudConsent(state), { ...state, cloudConsent: false, cloudConsentRevision: null });
});
test('legal links route internally, allow valid public links, and disable missing or unsafe destinations', () => {
  assert.deepEqual(legalLinkTarget('privacy.html'), { document: 'privacy' });
  assert.deepEqual(legalLinkTarget('mailto:privacy@example.com'), { url: 'mailto:privacy@example.com' });
  assert.deepEqual(legalLinkTarget('https://www.cloudflare.com/privacypolicy/'), { url: 'https://www.cloudflare.com/privacypolicy/' });
  for (const href of ['mailto:待确认', 'mailto:Pending confirmation', 'javascript:alert(1)', 'constructor', '__proto__', 'file:///secret', 'https://bad link', 'https://example.com/<bad>']) assert.equal(legalLinkTarget(href), undefined);
});
