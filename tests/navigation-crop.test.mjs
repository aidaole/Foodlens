import test from "node:test";
import assert from "node:assert/strict";
import { emptyState, restoreState } from "../src/lib/persisted-state.ts";
import {
  fullCrop,
  moveCrop,
  cropPixels,
  fitImage,
  insetCrop,
} from "../src/lib/crop.ts";
test("首次安装需要引导；完成后重启仍保持完成", () => {
  assert.equal(emptyState().onboarded, false);
  assert.equal(
    restoreState({ ...emptyState(), onboarded: true }).onboarded,
    true,
  );
});
test("升级旧记录保留收藏与偏好，并只为缺少标记的版本展示引导", () => {
  const old = {
    profile: { concerns: ["关注脂肪"], allergies: ["乳"] },
    saved: ["oat"],
    history: [{ id: "1", foodId: "oat", date: "2026-10-14" }],
  };
  const restored = restoreState(old);
  assert.deepEqual(restored.profile, old.profile);
  assert.deepEqual(restored.saved, old.saved);
  assert.deepEqual(restored.history, old.history);
  assert.equal(restored.onboarded, false);
});
test("裁剪像素按原图坐标换算，未改变的全图保留尺寸", () => {
  assert.deepEqual(cropPixels(fullCrop, 1024, 768), {
    originX: 0,
    originY: 0,
    width: 1024,
    height: 768,
  });
  assert.deepEqual(
    cropPixels({ x: 0.1, y: 0.25, width: 0.8, height: 0.5 }, 1000, 800),
    { originX: 100, originY: 200, width: 800, height: 400 },
  );
});
test("移动选区不会超出原图", () => {
  const r = { x: 0.1, y: 0.1, width: 0.6, height: 0.7 };
  const moved = moveCrop(r, "move", 3, -3);
  assert.equal(moved.x, 0.4);
  assert.equal(moved.y, 0);
  assert.equal(moved.width, r.width);
});
test("四角调整保持最小尺寸，不允许反转或越界", () => {
  for (const mode of ["tl", "tr", "bl", "br"])
    for (const dx of [-10, -0.2, 0.3, 10])
      for (const dy of [-10, 0.2, 10]) {
        const r = moveCrop(
          { x: 0.2, y: 0.2, width: 0.5, height: 0.5 },
          mode,
          dx,
          dy,
          0.1,
          0.1,
        );
        assert.ok(r.x >= 0 && r.y >= 0);
        assert.ok(r.width >= 0.1 - 1e-9 && r.height >= 0.1 - 1e-9);
        assert.ok(r.x + r.width <= 1 + 1e-9 && r.y + r.height <= 1 + 1e-9);
        const px = cropPixels(r, 1777, 999);
        assert.ok(
          px.originX + px.width <= 1777 && px.originY + px.height <= 999,
        );
      }
});
test("预览留白不会被误认为图片坐标，收紧选区确实缩小图片", () => {
  const fitted = fitImage(1000, 500, 300, 300);
  assert.deepEqual(fitted, { width: 300, height: 150, x: 0, y: 75 });
  assert.equal(cropPixels(insetCrop(fullCrop), 1024, 1024).width, 819);
});

// SDK 57 includes its navigation router; verify native back semantics against it.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {TabRouter,TabActions}=require('../node_modules/expo-router/build/react-navigation/routers/TabRouter.js');
test('三个Tab互相切换而不增加页面，系统返回不会回到上一个Tab',()=>{const nav=TabRouter({initialRouteName:'index',backBehavior:'none'});const options={routeNames:['index','history','profile'],routeParamList:{},routeGetIdList:{}};let state=nav.getInitialState(options);for(const name of ['history','profile','index','profile'])state=nav.getStateForAction(state,TabActions.jumpTo(name),options);assert.equal(state.routes.length,3);assert.equal(state.routes[state.index].name,'profile');assert.equal(nav.getStateForAction(state,{type:'GO_BACK'},options),null);});
