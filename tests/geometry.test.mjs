import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dimensions,stepScale} from '../public/geometry.js';
test('0.1倍ボタンの連打と上下限',()=>{let value=2;for(let i=0;i<80;i++)value=stepScale(value,.1);assert.equal(value,10);assert.equal(stepScale(10,.1),10);for(let i=0;i<80;i++)value=stepScale(value,-.1);assert.equal(value,2);assert.equal(stepScale(2,-.1),2);assert.equal(stepScale(NaN,.1),2.1);assert.equal(stepScale(2.37,.1),2.5);});
test('2〜10倍と小数倍率の正しい寸法',()=>{assert.deepEqual(dimensions(120,80,2),{width:240,height:160,allowed:true});assert.deepEqual(dimensions(120,80,10),{width:1200,height:800,allowed:true});assert.equal(dimensions(101,77,2.5).width,253);});
test('不正な倍率と大きすぎる出力を防ぐ',()=>{for(const scale of [1,11,NaN,Infinity])assert.throws(()=>dimensions(120,80,scale));assert.equal(dimensions(4000,3000,2).allowed,false);assert.equal(dimensions(9000,1,2).allowed,false);});
