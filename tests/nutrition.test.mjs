import test from "node:test";
import assert from "node:assert/strict";
import {
  foods,
  fmt,
  warnings,
  assessment,
  initialProfile,
} from "../src/lib/food.ts";
test("每100g数值按份量换算，整包脂肪不误用每100g值", () => {
  assert.equal(fmt(34, 30), "10.2");
  assert.equal(fmt(34, 60), "20.4");
  assert.equal(fmt(536, 60), "321.6");
});
test("缺失营养值保持未知，而不是零", () => {
  assert.equal(fmt(null, 30), "未标注");
});
test("饱和脂肪的提醒随食用份量改变", () => {
  assert.equal(assessment(foods[1], 30).flag, false);
  assert.equal(assessment(foods[1], 60).flag, true);
  assert.match(assessment(foods[1], 60).detail, /饱和脂肪/);
});
test("明确的过敏原匹配产生优先提醒", () => {
  const result = warnings(foods[0], { concerns: [], allergies: ["坚果"] }, 30);
  assert.equal(result[0].urgent, true);
  assert.match(result[0].body, /避免食用/);
});
test("可能含有声明与已含过敏原区分", () => {
  const result = warnings(foods[0], { concerns: [], allergies: ["乳"] }, 30);
  assert.match(result[0].title, /可能含有/);
  assert.equal(result[0].urgent, true);
});
test("云端过敏原原文能匹配设置，含乳与可能含有仍分开", () => {
  const f = { ...foods[2], allergens: ["含有乳"], mayContain: ["May contain peanuts"] };
  const result = warnings(f, { concerns: [], allergies: ["乳", "花生"] }, 100);
  assert.match(result[0].title, /匹配：乳/);
  assert.match(result[1].title, /可能含有：花生/);
  const no = warnings({ ...f, allergens: ["乳化剂", "不含牛奶"], mayContain: [] }, { concerns: [], allergies: ["乳"] }, 100);
  assert.equal(no[0].urgent, undefined);
});
test("血糖提醒使用总碳水，不把无添加糖当作安全许可", () => {
  const result = warnings(
    foods[2],
    { concerns: ["血糖管理"], allergies: [] },
    150,
  );
  assert.match(result[0].body, /6 g/);
  assert.match(result[0].body, /无添加糖不等于/);
});
test("未配置偏好时仍提示核对份量，不声称可食用", () => {
  const result = warnings(foods[0], initialProfile, 30);
  assert.equal(result.length, 1);
  assert.match(result[0].title, /份量/);
});

test("关注脂肪设置也生成包含脂肪种类和份量的提示", () => {
  const result = warnings(
    foods[0],
    { concerns: ["关注脂肪"], allergies: [] },
    30,
  );
  assert.match(result[0].body, /5.4 g/);
  assert.match(result[0].body, /饱和脂肪/);
});
