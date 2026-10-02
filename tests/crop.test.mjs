import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCrop,centeredCrop,cropFromPoints,cropRatio} from '../public/crop-geometry.js';
test('Crop remains inside source and has integer pixel dimensions',()=>{
  assert.deepEqual(normalizeCrop({x:-5,y:900,width:999,height:0},100,80),{x:0,y:79,width:100,height:1});
  assert.deepEqual(cropFromPoints({x:80,y:60},{x:10,y:5},100,80),{x:10,y:5,width:70,height:55});
});
test('Spotify preset selects a centered 7:3 crop',()=>{
  const c=centeredCrop(2400,1800,cropRatio('spotify',2400,1800));assert.equal(c.width,2400);assert.equal(c.height,1029);assert.equal(c.y,386);
  assert.ok(Math.abs(c.width/c.height-7/3)<.002);
});
test('All drag directions and constrained ratios stay within bounds',()=>{
  for(const ratio of [0,1,4/3,9/16,7/3])for(const start of [{x:0,y:0},{x:99,y:79},{x:50,y:40}])for(const end of [{x:-500,y:-500},{x:500,y:500},{x:12,y:68}]){
    const c=cropFromPoints(start,end,100,80,ratio);assert.ok(c.x>=0&&c.y>=0&&c.width>=1&&c.height>=1&&c.x+c.width<=100&&c.y+c.height<=80);
    if(ratio&&c.width>=10&&c.height>=10)assert.ok(Math.abs(c.width-c.height*ratio)<=1+ratio);
  }
});
