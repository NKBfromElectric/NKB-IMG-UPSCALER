import {dimensions,stepScale} from './geometry.js';
import {resizeImage} from './resize.js';
import {inspectImage} from './input.js';
import {makeZip} from './zip.js';
const $=id=>document.getElementById(id);
let items=[],active=0,busy=false,loading=false,stop=false,zipUrl=null,selectionGeneration=0;
const current=()=>items[active];
function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
function freeResult(item){if(item.result)URL.revokeObjectURL(item.result.url);item.result=null;}
function freeZip(){if(zipUrl)URL.revokeObjectURL(zipUrl);zipUrl=null;$('download-all').hidden=true;}
function dispose(){freeZip();items.forEach(item=>{freeResult(item);URL.revokeObjectURL(item.url);});}
function syncScaleButtons(){const value=Number($('scale-number').value);$('scale-minus').disabled=busy||loading||value<=2;$('scale-plus').disabled=busy||loading||value>=10;}
function lock(){document.querySelectorAll('.controls input,.controls select,.presets button,.scale-step-button,#replace,#file,#clear,#add').forEach(e=>e.disabled=busy||loading);$('cancel').hidden=!busy;syncScaleButtons();}
function renderList(){
 $('queue').replaceChildren();items.forEach((item,index)=>{const b=document.createElement('button');b.type='button';b.className='queue-item';b.setAttribute('aria-pressed',String(index===active));const name=document.createElement('span'),state=document.createElement('small');name.textContent=item.file.name;state.textContent=item.result?'完成':item.error?'エラー':'待機';b.append(name,state);b.addEventListener('click',()=>{active=index;render();});$('queue').append(b);});$('queue').hidden=items.length<2;$('queue-count').textContent=items.length?`${items.length}枚 / 最大10枚`:'';
}
function setPreview(element,url){
 if(element.getAttribute('src')===url)return;
 element.style.visibility='hidden';
 element.onload=()=>{if(element.getAttribute('src')===url)element.style.visibility='visible';};
 element.onerror=()=>{if(element.getAttribute('src')===url)status('プレビューを表示できません。画像を選び直してください。',true);};
 element.removeAttribute('src');element.src=url;
 if(element.complete&&element.naturalWidth)element.style.visibility='visible';
}
function render(){
 const item=current();renderList();$('dropzone').hidden=!!item;$('image-stage').hidden=!item;['replace','clear','add'].forEach(id=>$(id).hidden=!item);$('download').hidden=!item?.result;$('comparison-tools').hidden=!item?.result;
 if(!item){$('filename').textContent='まだ選択されていません';$('source-size').textContent='— × —';$('output-size').textContent='— × —';$('file-kind').textContent='JPG / PNG';$('preview').removeAttribute('src');$('before').removeAttribute('src');return;}
 $('filename').textContent=item.file.name;$('filename').title=item.file.name;$('source-size').textContent=`${item.width.toLocaleString()} × ${item.height.toLocaleString()} px`;$('file-kind').textContent=item.kind;
 setPreview($('preview'),item.result?.url||item.url);setPreview($('before'),item.url);$('preview-badge').textContent=item.result?`拡大後 · ${item.result.scale}×`:'元画像';
 if(item.result){$('download').href=item.result.url;$('download').download=item.result.name;}
 $('compare').value='0';$('before').hidden=true;$('compare-label').textContent='拡大後のみ';$('image-stage').classList.remove('actual');$('zoom').setAttribute('aria-pressed','false');$('zoom').textContent='100%で確認';
 $('image-stage').style.setProperty('--image-width',`${item.result?.width||item.width}px`);$('image-stage').style.setProperty('--image-height',`${item.result?.height||item.height}px`);
 try{const size=dimensions(item.width,item.height,Number($('scale-number').value));$('output-size').textContent=`${size.width.toLocaleString()} × ${size.height.toLocaleString()} px`;}catch{}
}
function update(invalidate=true){
 if(invalidate){freeZip();items.forEach(freeResult);}$('batch-errors').hidden=true;render();syncScaleButtons();const scale=Number($('scale-number').value);$('quality-row').hidden=$('format').value!=='image/jpeg';
 document.querySelectorAll('[data-scale]').forEach(b=>{const selected=Number(b.dataset.scale)===scale;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
 if(!items.length){$('process').disabled=true;status('画像を選択すると、拡大できます。');return;}
 try{const sizes=items.map(i=>dimensions(i.width,i.height,scale));const allowed=sizes.every(s=>s.allowed)&&sizes.reduce((sum,s)=>sum+s.width*s.height,0)<=100_000_000;$('process').disabled=busy||loading||!allowed;$('process').firstElementChild.textContent=items.length>1?`${items.length}枚をまとめて拡大`:'拡大する';status(allowed?'準備できました。拡大するボタンを押してください。':'出力が上限を超えています。倍率か枚数を減らしてください（1枚4,000万・合計1億画素）。',!allowed);}catch(e){$('process').disabled=true;status(e.message,true);}
}
function setScale(value){$('scale').value=value;$('scale-number').value=value;update();}
async function addFiles(files,append=false){
 if(busy){status('処理の完了後に画像を選んでください。',true);return;}const incoming=Array.from(files);if(!incoming.length)return;
 if(incoming.length+(append?items.length:0)>10){status('一度に選べる画像は10枚までです。',true);return;}
 if(incoming.reduce((n,f)=>n+f.size,append?items.reduce((n,i)=>n+i.file.size,0):0)>150*1024*1024){status('元画像の合計は150 MB以下にしてください。',true);return;}
 const token=++selectionGeneration;loading=true;lock();$('process').disabled=true;status('画像の形式とサイズを確認しています…');const accepted=[],errors=[];
 for(const file of incoming){if(token!==selectionGeneration)break;let url;try{const info=await inspectImage(file);url=URL.createObjectURL(file);const image=new Image();image.src=url;await image.decode();if(image.naturalWidth*image.naturalHeight>40_000_000||Math.max(image.naturalWidth,image.naturalHeight)>16384)throw new Error('元画像が大きすぎます。');accepted.push({file,url,kind:info.kind,width:image.naturalWidth,height:image.naturalHeight,result:null});image.src='';}catch(e){if(url)URL.revokeObjectURL(url);errors.push(`${file.name}: ${e.message}`);}}
 if(token!==selectionGeneration){accepted.forEach(item=>URL.revokeObjectURL(item.url));return;}loading=false;lock();if(accepted.length){if(!append){dispose();items=[];active=0;}items.push(...accepted);if(!append)$('format').value=items[0].kind==='PNG'?'image/png':'image/jpeg';update();}else update(false);if(errors.length)status(errors.join(' / ')+(accepted.length===0&&items.length?' 前の画像は変更していません。':''),true);
}
let appendSelection=false;
$('file').addEventListener('change',e=>{addFiles(e.target.files,appendSelection);appendSelection=false;e.target.value='';});
$('replace').addEventListener('click',()=>{appendSelection=false;$('file').click();});$('add').addEventListener('click',()=>{appendSelection=true;$('file').click();});
$('clear').addEventListener('click',()=>{selectionGeneration++;dispose();items=[];active=0;update();});
$('dropzone').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('file').click();}});
const zone=document.querySelector('.preview-panel');zone.addEventListener('dragover',e=>{e.preventDefault();$('dropzone').classList.add('dragover');});zone.addEventListener('dragleave',()=>$('dropzone').classList.remove('dragover'));zone.addEventListener('drop',e=>{e.preventDefault();$('dropzone').classList.remove('dragover');addFiles(e.dataTransfer.files);});
$('scale-minus').addEventListener('click',()=>setScale(stepScale(Number($('scale-number').value),-0.1)));$('scale-plus').addEventListener('click',()=>setScale(stepScale(Number($('scale-number').value),0.1)));
$('scale').addEventListener('input',()=>setScale(Number($('scale').value)));$('scale-number').addEventListener('input',()=>{const n=Number($('scale-number').value);if(n>=2&&n<=10)$('scale').value=n;update();});document.querySelectorAll('[data-scale]').forEach(b=>b.addEventListener('click',()=>setScale(Number(b.dataset.scale))));
['format','method','sharpness'].forEach(id=>$(id).addEventListener('change',update));$('quality').addEventListener('input',()=>{$('quality-value').value=`${$('quality').value}%`;update();});
$('compare').addEventListener('input',()=>{const n=Number($('compare').value);$('before').hidden=n===0;$('before').style.clipPath=`inset(0 ${100-n}% 0 0)`;$('compare-label').textContent=n===0?'拡大後のみ':n===100?'元画像のみ':`左 ${n}%：元画像 / 右：拡大後`;});
$('zoom').addEventListener('click',()=>{const actual=$('image-stage').classList.toggle('actual');$('zoom').setAttribute('aria-pressed',String(actual));$('zoom').textContent=actual?'全体を表示':'100%で確認';});
$('cancel').addEventListener('click',()=>{stop=true;$('cancel').disabled=true;status('現在の画像の処理後に停止します。');});
$('process').addEventListener('click',async()=>{
 if(!items.length||busy||loading||$('process').disabled)return;
 const scale=Number($('scale-number').value),format=$('format').value,quality=Number($('quality').value)/100,method=$('method').value,sharpness=Number($('sharpness').value);
 freeZip();items.forEach(item=>{freeResult(item);item.error=false;});render();stop=false;busy=true;lock();$('cancel').disabled=false;$('process').disabled=true;$('progress').hidden=false;$('progress').max=items.length;$('progress').value=0;let completed=0,failed=0;
 for(let index=0;index<items.length&&!stop;index++){
  const item=items[index],canvas=document.createElement('canvas'),image=new Image();status(`${index+1} / ${items.length}枚を拡大しています…`);$('process').firstElementChild.textContent='拡大しています…';
  try{image.src=item.url;await image.decode();const size=dimensions(image.naturalWidth,image.naturalHeight,scale);if(!size.allowed)throw new Error('出力サイズが上限を超えています。');canvas.width=size.width;canvas.height=size.height;await resizeImage(image,canvas,{method,jpeg:format==='image/jpeg',sharpness});const blob=await new Promise(resolve=>canvas.toBlob(resolve,format,quality));if(!blob||blob.type!==format)throw new Error('書き出しに失敗しました。倍率を下げてください。');const base=item.file.name.replace(/\.[^.]+$/,'').replace(/[\\/\x00-\x1f]/g,'_').slice(0,180);item.result={blob,url:URL.createObjectURL(blob),name:`${base}_${scale}x.${format==='image/png'?'png':'jpg'}`,scale,...size};completed++;}catch(e){item.error=true;item.errorMessage=e.message;failed++;}finally{image.src='';canvas.width=canvas.height=0;$('progress').value=index+1;renderList();}
 }
 active=Math.max(0,items.findIndex(i=>i.result));render();busy=false;lock();$('progress').hidden=true;$('process').disabled=false;$('process').firstElementChild.textContent=items.length>1?`${items.length}枚をまとめて拡大`:'拡大する';const result=current()?.result;
 status(`${stop?'停止しました。':'完成しました。'}${completed}枚を書き出し${failed?` / ${failed}枚で失敗（倍率を下げて再実行してください）`:''}${result?` · ${result.width.toLocaleString()} × ${result.height.toLocaleString()} px / ${(result.blob.size/1024/1024).toFixed(2)} MB`:''}`,failed>0);
 if(completed>1){$('download-all').hidden=false;$('download-all').textContent=`完成した${completed}枚をZIPで保存 ↓`;}
 $('batch-errors').textContent=items.filter(i=>i.error).map(i=>`${i.file.name}: ${i.errorMessage}`).join(' / ');$('batch-errors').hidden=!failed;
});
$('download-all').addEventListener('click',async()=>{
 if(busy||loading)return;loading=true;lock();$('process').disabled=true;$('download-all').disabled=true;try{if(!zipUrl){const entries=items.filter(i=>i.result).map((i,index)=>({blob:i.result.blob,name:`${String(index+1).padStart(2,'0')}_${i.result.name}`}));zipUrl=URL.createObjectURL(await makeZip(entries));}const a=document.createElement('a');a.href=zipUrl;a.download='NKB-IMG-UPSCALER.zip';a.click();}catch{status('ZIPを作成できませんでした。各画像を個別に保存してください。',true);}finally{loading=false;lock();$('process').disabled=false;$('download-all').disabled=false;}
});
syncScaleButtons();window.addEventListener('pagehide',e=>{if(!e.persisted)dispose();});
