import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,restoreState} from '../src/lib/persisted-state.ts';
import {isHistoryThumbnail,restoreThumbnails,MAX_THUMBNAIL_LENGTH} from '../src/lib/history-thumbnail.ts';
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
