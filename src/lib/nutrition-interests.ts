import type { Nutrients } from "./food";
export const nutritionInterests: { key: keyof Nutrients; label: string; unit: string; icon: string }[] = [
  {key:"energy",label:"热量",unit:"kcal",icon:"fire"},
  {key:"fat",label:"总脂肪",unit:"g",icon:"drop"},
  {key:"saturated",label:"饱和脂肪",unit:"g",icon:"drop"},
  {key:"protein",label:"蛋白质",unit:"g",icon:"leaf"},
  {key:"carbs",label:"碳水化合物",unit:"g",icon:"spark"},
  {key:"sugar",label:"糖",unit:"g",icon:"spark"},
  {key:"fiber",label:"膳食纤维",unit:"g",icon:"leaf"},
  {key:"sodium",label:"钠",unit:"mg",icon:"shield"},
];
export function validInterests(value: unknown): string[] {
  return Array.isArray(value) ? nutritionInterests.filter(n=>value.includes(n.key)).map(n=>n.key) : [];
}
