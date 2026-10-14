export type Nutrients = {
  energy: number | null;
  fat: number | null;
  saturated: number | null;
  carbs: number | null;
  protein: number | null;
  fiber: number | null;
  sugar: number | null;
  addedSugar: number | null;
  sodium: number | null;
};
export type Food = {
  id: string;
  name: string;
  english: string;
  category: string;
  color: string;
  kind: "oat" | "chips" | "yogurt";
  serving: number | null;
  pack: number | null;
  unit?: "g" | "mL";
  source?: "cloud";
  sourceText?: string;
  labelBasis?: { amount: number; unit: "g" | "mL"; evidence: string };
  nutrientEvidence?: Record<string, string>;
  labelNotes?: string[];
  ingredients: { name: string; note: string; flag?: boolean }[];
  allergens: string[];
  mayContain: string[];
  nutrients: Nutrients;
};
export const foods: Food[] = [
  {
    id: "oat",
    name: "坚果燕麦脆",
    english: "CRUNCHY OATS",
    category: "谷物零食",
    color: "#DDFC92",
    kind: "oat",
    serving: 30,
    pack: 180,
    ingredients: [
      { name: "燕麦片", note: "谷物原料；含碳水化合物与膳食纤维。" },
      { name: "扁桃仁", note: "坚果原料，也是需要关注的过敏原。", flag: true },
      { name: "蜂蜜", note: "提供甜味，属于添加糖来源。", flag: true },
      { name: "葵花籽油", note: "提供脂肪；需结合总脂肪和饱和脂肪含量判断。" },
      { name: "食用盐", note: "提供钠，需结合营养表与食用量判断。" },
    ],
    allergens: ["坚果"],
    mayContain: ["乳", "小麦"],
    nutrients: {
      energy: 450,
      fat: 18,
      saturated: 3,
      carbs: 60,
      protein: 10,
      fiber: 8,
      sugar: 16,
      addedSugar: 12,
      sodium: 180,
    },
  },
  {
    id: "chips",
    name: "海盐薯片",
    english: "SEA SALT CHIPS",
    category: "膨化零食",
    color: "#FFB89C",
    kind: "chips",
    serving: 30,
    pack: 60,
    ingredients: [
      { name: "马铃薯", note: "主要提供淀粉。" },
      { name: "植物油", note: "提供脂肪；示例标签未注明植物油种类。" },
      { name: "食用盐", note: "提供钠；注意份量。", flag: true },
    ],
    allergens: [],
    mayContain: ["乳", "大豆"],
    nutrients: {
      energy: 536,
      fat: 34,
      saturated: 10,
      carbs: 52,
      protein: 6,
      fiber: 4,
      sugar: 1,
      addedSugar: 0,
      sodium: 650,
    },
  },
  {
    id: "yogurt",
    name: "原味希腊酸奶",
    english: "GREEK YOGURT",
    category: "乳制品",
    color: "#DCD6FC",
    kind: "yogurt",
    serving: 150,
    pack: 150,
    ingredients: [
      { name: "生牛乳", note: "乳原料；乳过敏者应避免。", flag: true },
      { name: "乳酸菌", note: "用于发酵；仅凭配料无法判断活菌数量或效果。" },
    ],
    allergens: ["乳"],
    mayContain: [],
    nutrients: {
      energy: 97,
      fat: 5,
      saturated: 3.2,
      carbs: 4,
      protein: 9,
      fiber: 0,
      sugar: 4,
      addedSugar: 0,
      sodium: 36,
    },
  },
];
export type Profile = { concerns: string[]; allergies: string[]; nutritionInterests?: string[] };
export const initialProfile: Profile = { concerns: [], allergies: [] };
export const concerns = ["关注脂肪", "血脂管理", "血糖管理", "血压管理"];
export const allergies = [
  "乳",
  "鸡蛋",
  "花生",
  "坚果",
  "小麦",
  "大豆",
  "芝麻",
  "鱼",
  "甲壳类",
];
export const fmt = (v: number | null, grams = 100) =>
  v === null ? "未标注" : Number(((v * grams) / 100).toFixed(1)).toString();
const allergenWords: Record<string, RegExp> = {
  乳: /牛奶|牛乳|乳制品|含有?乳|^乳$|\bmilk\b/i,
  鸡蛋: /鸡蛋|蛋类|含有?蛋|^蛋$|\beggs?\b/i,
  花生: /花生|\bpeanuts?\b/i,
  坚果: /坚果|扁桃仁|杏仁|核桃|腰果|榛子|开心果|碧根果|\b(?:tree nuts?|almonds?|walnuts?|cashews?|hazelnuts?|pistachios?|pecans?)\b/i,
  小麦: /小麦|\bwheat\b/i,
  大豆: /大豆|黄豆|\b(?:soy|soya|soybeans?)\b/i,
  芝麻: /芝麻|\bsesame\b/i,
  鱼: /鱼|\bfish\b/i,
  甲壳类: /甲壳类|虾|蟹|龙虾|\b(?:crustaceans?|shrimps?|prawns?|crabs?|lobsters?)\b/i,
};
function matchedAllergies(statements: string[], selected: string[]) {
  return selected.filter((a) => statements.some((line) =>
    !/不含|不含有|free[- ]from|does not contain/i.test(line) &&
    (line === a || allergenWords[a]?.test(line))));
}
export function warnings(food: Food, profile: Profile, grams: number) {
  const notes: { title: string; body: string; urgent?: boolean }[] = [];
  const hit = matchedAllergies(food.allergens, profile.allergies);
  const maybe = matchedAllergies(food.mayContain, profile.allergies);
  if (hit.length)
    notes.push({
      title: `与你的过敏设置匹配：${hit.join("、")}`,
      body: "标签包含对应过敏原。如果你确诊对此过敏，应避免食用，并核对原包装。",
      urgent: true,
    });
  if (maybe.length)
    notes.push({
      title: `标签提示可能含有：${maybe.join("、")}`,
      body: "存在交叉接触风险；如对此过敏，请先向厂商或医生确认。",
      urgent: true,
    });
  if (profile.concerns.includes("关注脂肪"))
    notes.push({
      title: "关注脂肪 · 量与种类一起看",
      body: `当前份量总脂肪 ${fmt(food.nutrients.fat, grams)} g，饱和脂肪 ${fmt(food.nutrients.saturated, grams)} g。脂肪并非都一样，可比较同类食品的相同份量。`,
    });
  if (profile.concerns.includes("血糖管理"))
    notes.push({
      title: "血糖管理 · 看总碳水",
      body: `当前份量含碳水化合物 ${fmt(food.nutrients.carbs, grams)} g。无添加糖不等于不影响血糖，请结合自己的饮食计划。`,
    });
  if (profile.concerns.includes("血脂管理"))
    notes.push({
      title: "血脂管理 · 关注饱和脂肪",
      body: `当前份量含饱和脂肪 ${fmt(food.nutrients.saturated, grams)} g；食用份量与全天摄入同样重要。`,
    });
  if (profile.concerns.includes("血压管理"))
    notes.push({
      title: "血压管理 · 留意钠",
      body: `当前份量含钠 ${fmt(food.nutrients.sodium, grams)} mg；请结合医生给你的钠摄入建议。`,
    });
  if (!notes.length)
    notes.push({
      title: "先看份量，再做选择",
      body: "配料长短不能直接代表健康程度。请结合营养表、食用量和个人需要判断。",
    });
  return notes;
}
export function assessment(food: Food, grams: number) {
  const n = food.nutrients;
  const flags: string[] = [];
  if (n.saturated !== null && (n.saturated * grams) / 100 / 20 >= 0.2)
    flags.push("饱和脂肪");
  if (n.sodium !== null && (n.sodium * grams) / 100 / 2300 >= 0.2)
    flags.push("钠");
  if (n.addedSugar !== null && (n.addedSugar * grams) / 100 / 50 >= 0.2)
    flags.push("添加糖");
  return flags.length
    ? {
        title: "留意食用份量",
        detail: `这份的${flags.join("、")}达到成人参考日值的 20% 或以上。`,
        flag: true,
      }
    : {
        title: "看懂标签，安心选择",
        detail: "结合全天饮食安排份量；单个食品不能代表整体饮食。",
        flag: false,
      };
}
export const SOURCE =
  "https://www.fda.gov/food/nutrition-facts-label/how-understand-and-use-nutrition-facts-label";
