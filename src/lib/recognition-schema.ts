import type { Food, Nutrients } from "./food";
export const nutrientKeys = [
  "energy",
  "fat",
  "saturated",
  "carbs",
  "protein",
  "fiber",
  "sugar",
  "addedSugar",
  "sodium",
] as const;
export class LabelError extends Error {}
const obj = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw new LabelError("标签数据格式不完整，请重新拍摄。");
  return v as Record<string, unknown>;
};
const text = (v: unknown, max = 1000): string => {
  if (typeof v !== "string" || v.length > max)
    throw new LabelError("标签文字格式异常，请重新拍摄。");
  return v.trim();
};
const list = (v: unknown, limit: number): string[] => {
  if (!Array.isArray(v) || v.length > limit)
    throw new LabelError("标签字段异常，请重新拍摄。");
  return [...new Set(v.map((s) => text(s, 300)).filter(Boolean))];
};
const number = (v: unknown): number => {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 1000000)
    throw new LabelError("标签数值无法确认，请重新拍摄。");
  return v;
};
const compact = (v: string) =>
  v.normalize("NFKC").replace(/\s/g, "").toLowerCase();
function evidence(value: number, line: string, source: string, unit: string) {
  const c = compact(line);
  const units =
    unit === "kJ"
      ? ["kj", "千焦"]
      : unit === "kcal"
        ? ["kcal", "千卡", "大卡"]
        : unit === "mg"
          ? ["mg", "毫克"]
          : unit === "mL"
            ? ["ml", "毫升"]
            : ["g", "克"];
  return (
    !!c &&
    compact(source).includes(c) &&
    units.some((u) => c.includes(u)) &&
    (c.match(/\d+(?:[.,]\d+)?/g) ?? []).some(
      (n) => Number(n.replace(",", ".")) === value,
    )
  );
}
function quantity(v: unknown, source: string, expected?: string) {
  if (v === null) return null;
  const q = obj(v),
    amount = number(q.amount);
  if (amount <= 0 || (q.unit !== "g" && q.unit !== "mL"))
    throw new LabelError("标签份量单位不清晰，请重新拍摄。");
  const line = text(q.evidence, 500);
  if (!evidence(amount, line, source, q.unit)) return null;
  if (expected && q.unit !== expected) return null;
  return { amount, unit: q.unit as "g" | "mL", evidence: line };
}
export function parseLabel(raw: unknown, id: string): Food {
  const p = obj(raw);
  if (p.needsRetake !== false)
    throw new LabelError(
      typeof p.reason === "string"
        ? text(p.reason, 300) || "标签不清晰，请拍清配料表和营养表。"
        : "标签不清晰，请拍清配料表和营养表。",
    );
  const sourceText = text(p.sourceText, 16000);
  if (!sourceText) throw new LabelError("没有读到标签文字，请重新拍摄。");
  const basis = quantity(p.basis, sourceText);
  if (!basis || basis.amount > 10000)
    throw new LabelError(
      "没能确认每100g、每100mL或每份的基准，请拍清营养表表头。",
    );
  const serving = quantity(p.serving, sourceText, basis.unit);
  const pack = quantity(p.pack, sourceText, basis.unit);
  const rawN = obj(p.nutrition);
  const nutrients = {} as Nutrients;
  const labelNotes: string[] = [];
  const nutrientEvidence: Record<string, string> = {};
  for (const key of nutrientKeys) {
    const item = rawN[key];
    if (item === null || item === undefined) {
      nutrients[key] = null;
      continue;
    }
    const n = obj(item),
      value = number(n.value),
      unit = text(n.unit, 10),
      line = text(n.evidence, 500);
    const allowed =
      key === "energy"
        ? ["kJ", "kcal"]
        : key === "sodium"
          ? ["g", "mg"]
          : ["g", "mg"];
    if (!allowed.includes(unit))
      throw new LabelError("营养单位不清晰，请重新拍摄。");
    if (!evidence(value, line, sourceText, unit)) {
      nutrients[key] = null;
      labelNotes.push("部分数值缺少可核对原文，已留空。");
      continue;
    }
    const unitFactor =
      key === "energy"
        ? unit === "kJ"
          ? 1 / 4.184
          : 1
        : key === "sodium"
          ? unit === "g"
            ? 1000
            : 1
          : unit === "mg"
            ? 0.001
            : 1;
    const normalized = (value * unitFactor * 100) / basis.amount;
    const max = key === "energy" ? 1000 : key === "sodium" ? 100000 : 100;
    if (normalized > max + 0.5)
      throw new LabelError("营养数值或基准可能读错，请重新拍摄。");
    nutrients[key] = normalized;
    nutrientEvidence[key] = line;
  }
  if (
    basis.unit === "g" &&
    (nutrients.fat ?? 0) + (nutrients.carbs ?? 0) + (nutrients.protein ?? 0) >
      105
  )
    throw new LabelError("营养数值与份量不一致，请重新拍摄。");
  const ingredientNames = list(p.ingredients, 80).filter((n) =>
    compact(sourceText).includes(compact(n)),
  );
  if (
    !ingredientNames.length &&
    nutrientKeys.every((k) => nutrients[k] === null)
  )
    throw new LabelError("没有读到可核对的配料或营养数值，请重新拍摄。");
  const allergens = list(p.allergens, 20).filter((n) =>
    compact(sourceText).includes(compact(n)),
  );
  const mayContain = list(p.mayContain, 20).filter((n) =>
    compact(sourceText).includes(compact(n)),
  );
  if (!ingredientNames.length) labelNotes.push("配料表未读到，请补拍配料表。");
  if (nutrients.energy === null || nutrients.fat === null)
    labelNotes.push("热量或脂肪未读到，请核对包装或补拍营养表。");
  if (!serving)
    labelNotes.push("每份用量未确认，先按每100" + basis.unit + "显示。");
  return {
    id,
    name:
      p.name !== null &&
      compact(sourceText).includes(compact(text(p.name, 100)))
        ? text(p.name, 100) || "这份食品"
        : "这份食品",
    english: "YOUR LABEL",
    category: "食品标签",
    color: "#DDFC92",
    kind: "oat",
    serving: serving?.amount ?? null,
    pack: pack?.amount ?? null,
    unit: basis.unit,
    ingredients: ingredientNames.map((name) => ({
      name,
      note: "包装配料表原文；结合营养表、食用量和个人需要查看。",
    })),
    allergens,
    mayContain,
    nutrients,
    source: "cloud",
    sourceText,
    labelBasis: basis,
    nutrientEvidence,
    labelNotes: [...new Set(labelNotes)],
  };
}
export function parseModelText(value: unknown, id: string) {
  const output = obj(value);
  let response = output.response;
  if (output.choices !== undefined) {
    if (!Array.isArray(output.choices) || output.choices.length !== 1)
      throw new LabelError("识别结果不完整，请重试。");
    const choice = obj(output.choices[0]);
    const message = obj(choice.message);
    if (choice.finish_reason !== "stop" || message.refusal || message.tool_calls)
      throw new LabelError("识别结果不完整，请重试。");
    response = message.content;
  }
  if (typeof response !== "string" || response.length > 30000)
    throw new LabelError("识别结果不完整，请重试。");
  let raw: unknown;
  try {
    raw = JSON.parse(
      response
        .trim()
        .replace(/^```(?:json)?\s*/, "")
        .replace(/\s*```$/, ""),
    );
  } catch {
    throw new LabelError("识别结果不完整，请重试或拍清标签。");
  }
  return parseLabel(raw, id);
}
export function isCloudFood(value: unknown): value is Food {
  try {
    const f = obj(value);
    if (
      f.source !== "cloud" ||
      !text(f.id, 100).startsWith("scan-") ||
      !text(f.name, 100)
    )
      return false;
    if (f.unit !== "g" && f.unit !== "mL") return false;
    for (const q of [f.serving, f.pack])
      if (q !== null && number(q) <= 0) return false;
    const n = obj(f.nutrients);
    for (const key of nutrientKeys) if (n[key] !== null) number(n[key]);
    if (!Array.isArray(f.ingredients) || f.ingredients.length > 80)
      return false;
    for (const i of f.ingredients) {
      const r = obj(i);
      text(r.name, 300);
      text(r.note, 500);
    }
    list(f.allergens, 20);
    list(f.mayContain, 20);
    text(f.sourceText, 16000);
    list(f.labelNotes, 20);
    if (!quantity(f.labelBasis, text(f.sourceText, 16000), f.unit))
      return false;
    for (const k of nutrientKeys)
      if (
        n[k] !== null &&
        number(n[k]) >
          (k === "energy" ? 1000.5 : k === "sodium" ? 100000.5 : 100.5)
      )
        return false;
    return (
      f.color === "#DDFC92" &&
      f.kind === "oat" &&
      f.english === "YOUR LABEL" &&
      f.category === "食品标签"
    );
  } catch {
    return false;
  }
}
