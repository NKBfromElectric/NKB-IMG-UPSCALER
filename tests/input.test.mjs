import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectImage} from '../public/input.js';
function png(w,h){const bytes=new Uint8Array(24),v=new DataView(bytes.buffer);bytes.set([137,80,78,71,13,10,26,10]);v.setUint32(12,0x49484452);v.setUint32(16,w);v.setUint32(20,h);return new Blob([bytes]);}
test('Inspect bytes rather than trusting file extension or MIME',async()=>{assert.deepEqual(await inspectImage(png(32,24)),{width:32,height:24,kind:'PNG'});await assert.rejects(inspectImage(new Blob(['not an image'])),/確認できません/);});
test('Reject extreme decoded size before Image.decode',async()=>{await assert.rejects(inspectImage(png(12000,12000)),/4,000万/);await assert.rejects(inspectImage(png(20000,10)),/16,384/);});
test('Parse JPEG frame and reject incomplete marker segments',async()=>{const jpg=new Blob([new Uint8Array([255,216,255,192,0,17,8,0,24,0,32,3,1,17,0,2,17,0,3,17,0])]);assert.deepEqual(await inspectImage(jpg),{width:32,height:24,kind:'JPG'});await assert.rejects(inspectImage(new Blob([new Uint8Array([255,216,255,192,0,17])])),/確認できません/);});
