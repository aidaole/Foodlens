import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { missingOperatorFields, syncLegalBundle } from './legal-content.mjs';

const project = fileURLToPath(new URL("../", import.meta.url));
const source = path.join(project, "docs/legal");
const config = JSON.parse(await readFile(path.join(source, "operator.json"), "utf8"));
const publish = process.argv.includes("--publish");
const email = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const missing = missingOperatorFields(config);
if (publish && missing.length) {
  throw new Error(`Legal publication blocked. Complete and verify docs/legal/operator.json: ${missing.join(", ")}. No public files were written.`);
}
await syncLegalBundle();
const output = path.join(project, publish ? "public/legal" : ".tools/legal-preview");
await mkdir(output, { recursive: true });
const fields = {
  operatorName: config.operatorName || "[Operator name pending]",
  privacyEmail: config.privacyEmail || "Privacy email pending",
  supportEmail: config.supportEmail || "Support email pending",
  effectiveDate: config.effectiveDate || "[Effective date pending]",
};
const escape = value => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
function inline(value) {
  let html = "", at = 0;
  for (const match of value.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
    html += escape(value.slice(at, match.index));
    const [, label, href] = match;
    const safe = /^https:\/\/[^\s<>]+$/.test(href) || /^mailto:/.test(href) && email.test(href.slice(7)) || /^(privacy|terms|support|index)\.html$/.test(href);
    html += safe ? `<a href="${escape(href)}">${escape(label)}</a>` : escape(label);
    at = match.index + match[0].length;
  }
  return html + escape(value.slice(at));
}
function render(markdown) {
  return markdown.trim().split(/\n\s*\n/).map(block => {
    const heading = block.match(/^(#{1,2}) (.+)$/);
    if (heading) return `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`;
    if (block.startsWith("- ")) return `<ul>${block.split("\n").map(line => `<li>${inline(line.replace(/^- /, ""))}</li>`).join("")}</ul>`;
    return `<p>${inline(block.replace(/\n/g, " "))}</p>`;
  }).join("\n");
}
const banner = publish ? "" : `<aside role="note"><strong>Draft for review</strong><p>This preview is not an active policy or a store submission URL. Operator identity, public contact details, launch markets, and the effective date must be verified before publication.</p></aside>`;
function page(title, body) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)} · FoodLens</title>${publish ? "" : '<meta name="robots" content="noindex,nofollow">'}
<style>*{box-sizing:border-box}body{margin:0;background:#f7f8f2;color:#20271f;font:17px/1.7 system-ui,-apple-system,sans-serif}header,main,footer{max-width:820px;margin:auto;padding:24px}header{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;border-bottom:1px solid #e6e8de}.brand{font-size:22px;font-weight:750;text-decoration:none;color:#20271f}nav{display:flex;flex-wrap:wrap;gap:18px}a{color:#42632b;overflow-wrap:anywhere}a:focus-visible{outline:3px solid #42632b;outline-offset:4px}h1{font-size:clamp(30px,7vw,42px);line-height:1.2;letter-spacing:-.035em;margin:26px 0}h2{font-size:23px;line-height:1.35;margin-top:38px}p{margin:16px 0}aside{background:#f3edd7;border-radius:18px;padding:20px;margin:16px 0 30px}aside p{margin-bottom:0}footer{font-size:14px;border-top:1px solid #e6e8de;color:#67705e}li{margin:8px 0}@media(max-width:420px){header,main,footer{padding:20px}body{font-size:16px}nav{gap:14px}}</style></head>
<body><header><a class="brand" href="index.html">FoodLens</a><nav aria-label="Legal pages"><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="support.html">Support</a></nav></header><main>${banner}${body}</main><footer>FoodLens · ${escape(publish ? config.operatorName : "Legal documents preview")}</footer></body></html>\n`;
}
for (const [input, outputName] of [["privacy-policy.md", "privacy.html"], ["terms-of-use.md", "terms.html"], ["support.md", "support.html"]]) {
  const raw = await readFile(path.join(source, input), "utf8");
  const filled = raw.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in fields)) throw new Error(`Unknown policy field ${key}`);
    return fields[key];
  });
  if (publish && (filled.includes("{{") || /\[.*pending\]/i.test(filled))) throw new Error("Unresolved draft field");
  const title = filled.split("\n")[0].replace(/^# /, "");
  await writeFile(path.join(output, outputName), page(title, render(filled)));
}
await writeFile(path.join(output, "index.html"), page("Privacy and support", render("# FoodLens Privacy and Support\n\nRead how FoodLens handles label photos and local records, understand service conditions, or get help.\n\n- [Privacy Policy](privacy.html)\n- [Terms of Use](terms.html)\n- [Support](support.html)")));
console.log(`${publish ? "Publication files" : "Draft preview"} generated at ${output}`);
if (!publish && missing.length) console.log(`Before publication, verify: ${missing.join(", ")}`);
