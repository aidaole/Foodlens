import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const legalRoot = fileURLToPath(new URL('../docs/legal/', import.meta.url));
export const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
export function missingOperatorFields(config) {
  const missing = [];
  if (typeof config.operatorName !== 'string' || !config.operatorName.trim()) missing.push('operatorName');
  for (const key of ['privacyEmail', 'supportEmail']) if (typeof config[key] !== 'string' || !emailPattern.test(config[key])) missing.push(key);
  const date = new Date(config.effectiveDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(config.effectiveDate ?? '') || Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== config.effectiveDate) missing.push('effectiveDate');
  if (!Array.isArray(config.launchMarkets) || !config.launchMarkets.length || config.launchMarkets.some(x => typeof x !== 'string' || !x.trim())) missing.push('launchMarkets');
  if (config.publicationReady !== true) missing.push('publicationReady');
  return missing;
}
export async function createLegalBundle(config) {
  const active = missingOperatorFields(config).length === 0;
  const documents = {};
  for (const [id, file] of Object.entries({ privacy: 'privacy-policy', terms: 'terms-of-use', support: 'support', health: 'health-notice' })) {
    documents[id] = {};
    for (const lang of ['zh', 'en']) {
      const raw = await readFile(path.join(legalRoot, `${file}${lang === 'zh' ? '.zh' : ''}.md`), 'utf8');
      const pending = lang === 'zh' ? '待确认' : 'Pending confirmation';
      const fields = Object.fromEntries(['operatorName', 'privacyEmail', 'supportEmail', 'effectiveDate'].map(key => [key, config[key] || pending]));
      const filled = raw.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        if (!(key in fields)) throw new Error(`Unknown policy field ${key}`);
        return fields[key];
      });
      documents[id][lang] = filled.trim().split(/\n\s*\n/).map(block => {
        const heading = block.match(/^(#{1,2}) (.+)$/);
        return { kind: heading ? heading[1].length === 1 ? 'title' : 'heading' : 'paragraph', text: heading ? heading[2] : block.replace(/\n/g, ' ') };
      });
    }
  }
  const content = { active, operator: config.operatorName || '', privacyEmail: emailPattern.test(config.privacyEmail ?? '') ? config.privacyEmail : '', supportEmail: emailPattern.test(config.supportEmail ?? '') ? config.supportEmail : '', effectiveDate: config.effectiveDate || '', documents };
  const revision = createHash('sha256').update(JSON.stringify(content)).digest('hex').slice(0, 20);
  return { ...content, revision };
}
export async function syncLegalBundle() {
  const config = JSON.parse(await readFile(path.join(legalRoot, 'operator.json'), 'utf8'));
  const bundle = await createLegalBundle(config);
  const output = fileURLToPath(new URL('../src/content/legal-documents.json', import.meta.url));
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(bundle, null, 2) + '\n');
  console.log(`Offline legal content synced (${bundle.active ? 'active' : 'draft'}, revision ${bundle.revision}).`);
  return bundle;
}
