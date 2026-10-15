import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,restoreState,appendRecognition} from '../src/lib/persisted-state.ts';
import {isHistoryThumbnail,restoreThumbnails,MAX_THUMBNAIL_LENGTH,thumbnailPlans,compressHistoryThumbnail,thumbnailDimensions} from '../src/lib/history-thumbnail.ts';
import {validInterests} from '../src/lib/nutrition-interests.ts';
import {readFileSync} from 'node:fs';
import {parseLabel} from '../src/lib/recognition-schema.ts';
const image='data:image/jpeg;base64,/9j/AAAAAA==';
test('thumbnail validation rejects expired local URLs, remote images, and oversized payloads',()=>{
 assert.ok(isHistoryThumbnail(image));
 for(const value of ['blob:test','file:///cache/photo.jpg','https://test/photo.jpg','data:image/png;base64,AAAA',image+'A'.repeat(MAX_THUMBNAIL_LENGTH)])assert.equal(isHistoryThumbnail(value),false);
});
test('thumbnail storage only retains known foods and survives serialized restore',()=>{
 const food=parseLabel(JSON.parse(readFileSync(new URL('./fixtures/label.json',import.meta.url))),'scan-thumb');
 const state={...emptyState(),recognized:[food],thumbnails:{'scan-thumb':image,deleted:image},profile:{concerns:['血糖管理'],allergies:['乳'],nutritionInterests:['fat','protein']}};
 const restored=restoreState(JSON.parse(JSON.stringify(state)));
 assert.deepEqual(restored.thumbnails,{'scan-thumb':image});
 assert.deepEqual(restored.profile,state.profile);
 assert.equal(restoreState({...emptyState(),recognized:[food]}).thumbnails['scan-thumb'],undefined);
 assert.deepEqual(restoreThumbnails(state.thumbnails,[]),{});
});
test('nutrition interests normalize duplicates and unknown values without losing medical or allergy preferences',()=>{
 assert.deepEqual(validInterests(['fat','unknown','sugar','fat']),['fat','sugar']);
 assert.deepEqual(validInterests('fat'),[]);
 const restored=restoreState({...emptyState(),profile:{concerns:['血脂管理'],allergies:['乳'],nutritionInterests:['bad','protein']}});
 assert.deepEqual(restored.profile,{concerns:['血脂管理'],allergies:['乳'],nutritionInterests:['protein']});
});
test('detailed photos that exceed the thumbnail budget are resized rather than discarded',async()=>{
 const calls=[];
 const thumbnail=await compressHistoryThumbnail(3060,1848,async plan=>{
  calls.push(plan);
  return '/9j/'+Buffer.alloc(plan.width>=200?14000:6000).toString('base64');
 },new AbortController().signal);
 assert.ok(isHistoryThumbnail(thumbnail));
 assert.ok(calls.some(p=>p.width===160));
 assert.ok(calls.every(p=>Math.abs(p.width/p.height-3060/1848)<0.025));
 assert.ok(thumbnail.length<=MAX_THUMBNAIL_LENGTH);
 const small=thumbnailPlans(40,24);
 assert.ok(small.every(p=>p.width===40&&p.height===24));
});
test('canceled photo preparation does not emit a thumbnail or continue encoding',async()=>{
 const controller=new AbortController();let calls=0;
 const result=await compressHistoryThumbnail(2400,1800,async()=>{calls++;controller.abort();return image.slice(23);},controller.signal);
 assert.equal(result,undefined);assert.equal(calls,1);
});
test('a photo is saved with its own result and survives restart, while genuinely missing photos stay absent',()=>{
 const food=parseLabel(JSON.parse(readFileSync(new URL('./fixtures/label.json',import.meta.url))),'scan-photo');
 const next=appendRecognition(emptyState(),food,image);
 const restored=restoreState(JSON.parse(JSON.stringify(next)));
 assert.equal(restored.history[0].foodId,food.id);
 assert.equal(restored.thumbnails[restored.history[0].foodId],image);
 assert.equal(appendRecognition(restored,food).thumbnails[food.id],image);
 assert.equal(appendRecognition(restored,food,'file:///expired.jpg').thumbnails[food.id],image);
 assert.equal(appendRecognition(restored,{...food,id:'scan-missing'}).thumbnails['scan-missing'],undefined);
});
test('pruning old results removes only their photos, retaining the new 50 records and favorites',()=>{
 const food=parseLabel(JSON.parse(readFileSync(new URL('./fixtures/label.json',import.meta.url))),'scan-0');
 let state=emptyState();
 for(let i=0;i<50;i++)state=appendRecognition(state,{...food,id:'scan-'+i},image);
 state.saved=['scan-0','scan-1','oat'];
 state=appendRecognition(state,{...food,id:'scan-50'},image);
 assert.equal(state.recognized.length,50);assert.equal(state.history.length,50);
 assert.equal(Object.keys(state.thumbnails).length,50);
 assert.equal(state.thumbnails['scan-0'],undefined);
 assert.equal(state.thumbnails['scan-50'],image);
 assert.deepEqual(state.saved,['scan-1','oat']);
});
test('JPEG dimensions are available without native image lookup, including progressive images and malformed input',()=>{
 // A real encoder-produced JPEG header; decoding the image remains the renderer's job.
 const jpeg=readFileSync(new URL('./fixtures/thumbnail-label.jpg',import.meta.url));
 const uri='data:image/jpeg;base64,'+jpeg.toString('base64');
 assert.deepEqual(thumbnailDimensions(uri),{width:140,height:170});
 const progressive=Buffer.from(jpeg);
 const marker=progressive.indexOf(Buffer.from([0xff,0xc0]));
 assert.ok(marker>0);progressive[marker+1]=0xc2;
 assert.deepEqual(thumbnailDimensions('data:image/jpeg;base64,'+progressive.toString('base64')),{width:140,height:170});
 for(const invalid of [undefined,'file:///cache/photo.jpg',image,'data:image/jpeg;base64,/9j/4AAQ'])assert.equal(thumbnailDimensions(invalid),undefined);
});
