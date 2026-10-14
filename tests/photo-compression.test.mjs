import test from "node:test";
import assert from "node:assert/strict";
import {compressionPlans,compressLabelPhoto,jpegBytes,TARGET_IMAGE_BYTES,MAX_IMAGE_BYTES} from "../src/lib/photo-compression.ts";
const signal=()=>new AbortController().signal;
test("大图保留2400长边与比例，小图不放大，也不缩到低分辨率",()=>{
  const large=compressionPlans(3060,1848);
  assert.deepEqual(large[0],{width:2400,height:1449,quality:0.86});
  assert.equal(large.at(-1).width,1800);
  assert.ok(large.every(p=>Math.abs(p.width/p.height-3060/1848)<0.002));
  assert.ok(compressionPlans(1280,1211).every(p=>p.width===1280&&p.height===1211));
});
test("准确统计JPEG原字节，目标内保留第一份高质量编码",async()=>{
  for (const n of [100,101,102]) assert.equal(jpegBytes(Buffer.alloc(n).toString("base64")),n);
  let calls=0;
  const result=await compressLabelPhoto(3060,1848,async p=>{calls++; return {...p,base64:Buffer.alloc(200000).toString("base64")};},signal());
  assert.equal(calls,1); assert.equal(result.width,2400); assert.equal(result.bytes,200000);
});
test("先降低JPEG体积，再缩小尺寸；超出硬上限才要求裁掉背景",async()=>{
  let calls=0;
  const result=await compressLabelPhoto(3060,1848,async p=>({...p,base64:Buffer.alloc(++calls<3?1000000:500000).toString("base64")}),signal());
  assert.equal(calls,3); assert.equal(result.width,2048); assert.ok(result.bytes<TARGET_IMAGE_BYTES);
  await assert.rejects(compressLabelPhoto(3060,1848,async p=>({...p,base64:Buffer.alloc(MAX_IMAGE_BYTES+1).toString("base64")}),signal()),e=>e.code==="IMAGE");
});
test("取消后不继续压缩或发送，尺寸异常不能处理",async()=>{
  const c=new AbortController();c.abort();let calls=0;
  await assert.rejects(compressLabelPhoto(3060,1848,async()=>{calls++;},c.signal),e=>e.code==="CANCELED");
  assert.equal(calls,0); assert.throws(()=>compressionPlans(NaN,100),e=>e.code==="IMAGE");
});
