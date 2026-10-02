import {dimensions, stepScale} from './geometry.js';
import {resizeImage} from './resize.js';
const $=id=>document.getElementById(id);
let image=null, sourceUrl=null, resultUrl=null, selectedFile=null, busy=false, generation=0;
function status(message,error=false){$('status').textContent=message;$('status').classList.toggle('error',error);}
function clearResult(){if(resultUrl)URL.revokeObjectURL(resultUrl);resultUrl=null;$('download').hidden=true;if(sourceUrl){$('preview').src=sourceUrl;$('preview-badge').textContent='元画像';}}
function syncScaleButtons(){const value=Number($('scale-number').value);$('scale-minus').disabled=busy||value<=2;$('scale-plus').disabled=busy||value>=10;}
function setScale(value){$('scale').value=value;$('scale-number').value=value;update();}
function update(){
  clearResult(); syncScaleButtons(); const scale=Number($('scale-number').value);
  $('quality-row').hidden=$('format').value!=='image/jpeg';
  document.querySelectorAll('[data-scale]').forEach(b=>{const selected=Number(b.dataset.scale)===scale;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
  if(!image){$('process').disabled=true;return;}
  try {const size=dimensions(image.width,image.height,scale);$('output-size').textContent=`${size.width.toLocaleString()} × ${size.height.toLocaleString()} px`;$('process').disabled=busy||!size.allowed;status(size.allowed?'準備できました。拡大するボタンを押してください。':'出力サイズが上限を超えています。倍率を下げるか、小さい画像を選んでください。',!size.allowed);}catch(e){$('process').disabled=true;status(e.message,true);}
}
async function load(file){
  if(!file||busy)return;
  const token=++generation;
  if(!/\.(jpe?g|png)$/i.test(file.name)||!['image/jpeg','image/png',''].includes(file.type)){status('JPGまたはPNGの画像を選んでください。',true);return;}
  if(file.size>30*1024*1024){status('ファイルサイズは30 MB以下にしてください。',true);return;}
  const url=URL.createObjectURL(file);const candidate=new Image();candidate.src=url;
  try {await candidate.decode();if(token!==generation){URL.revokeObjectURL(url);return;}clearResult();if(sourceUrl)URL.revokeObjectURL(sourceUrl);sourceUrl=url;image=candidate;selectedFile=file;$('preview').src=url;$('dropzone').hidden=true;$('image-stage').hidden=false;$('replace').hidden=false;$('filename').textContent=file.name;$('filename').title=file.name;$('source-size').textContent=`${image.width.toLocaleString()} × ${image.height.toLocaleString()} px`;$('file-kind').textContent=/\.png$/i.test(file.name)?'PNG':'JPG';$('format').value=/\.png$/i.test(file.name)?'image/png':'image/jpeg';update();}catch{URL.revokeObjectURL(url);status('画像を読み込めませんでした。別のJPG・PNGをお試しください。',true);}
}
$('file').addEventListener('change',e=>{load(e.target.files[0]);e.target.value='';});
$('replace').addEventListener('click',()=>$('file').click());
$('dropzone').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('file').click();}});
const zone=$('preview-panel')||document.querySelector('.preview-panel');
zone.addEventListener('dragover',e=>{e.preventDefault();$('dropzone').classList.add('dragover');});zone.addEventListener('dragleave',()=>$('dropzone').classList.remove('dragover'));zone.addEventListener('drop',e=>{e.preventDefault();$('dropzone').classList.remove('dragover');load(e.dataTransfer.files[0]);});
$('scale-minus').addEventListener('click',()=>setScale(stepScale(Number($('scale-number').value),-0.1)));
$('scale-plus').addEventListener('click',()=>setScale(stepScale(Number($('scale-number').value),0.1)));
$('scale').addEventListener('input',()=>setScale(Number($('scale').value)));
$('scale-number').addEventListener('input',()=>{const n=Number($('scale-number').value);if(n>=2&&n<=10)$('scale').value=n;update();});
document.querySelectorAll('[data-scale]').forEach(b=>b.addEventListener('click',()=>setScale(Number(b.dataset.scale))));
['format','method'].forEach(id=>$(id).addEventListener('change',update));$('quality').addEventListener('input',()=>{$('quality-value').value=`${$('quality').value}%`;update();});
$('process').addEventListener('click',async()=>{
  if(!image||busy)return;const scale=Number($('scale-number').value);let size;try{size=dimensions(image.width,image.height,scale);}catch(e){status(e.message,true);return;}if(!size.allowed)return;
  const format=$('format').value,quality=Number($('quality').value)/100,method=$('method').value;
  busy=true;clearResult();$('process').disabled=true;document.querySelectorAll('.controls input,.controls select,.presets button,.scale-step-button,#replace,#file').forEach(e=>e.disabled=true);$('process').firstElementChild.textContent='拡大しています…';status('画像を処理しています。このままお待ちください。');
  const canvas=document.createElement('canvas');
  try {await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));canvas.width=size.width;canvas.height=size.height;await resizeImage(image,canvas,{method,jpeg:format==='image/jpeg'});const blob=await new Promise(resolve=>canvas.toBlob(resolve,format,quality));if(!blob||blob.type!==format)throw new Error('書き出しに失敗しました。倍率を下げてお試しください。');resultUrl=URL.createObjectURL(blob);$('download').href=resultUrl;$('download').download=`${selectedFile.name.replace(/\.[^.]+$/,'')}_${scale}x.${format==='image/png'?'png':'jpg'}`;$('download').hidden=false;$('preview').src=resultUrl;$('preview-badge').textContent=`拡大後 · ${scale}×`;status(`完成しました。${size.width.toLocaleString()} × ${size.height.toLocaleString()} px / ${(blob.size/1024/1024).toFixed(2)} MB`);}catch(e){status(e.message||'処理に失敗しました。倍率を下げてお試しください。',true);}finally{canvas.width=canvas.height=0;busy=false;document.querySelectorAll('.controls input,.controls select,.presets button,.scale-step-button,#replace,#file').forEach(e=>e.disabled=false);$('process').disabled=false;$('process').firstElementChild.textContent='拡大する';syncScaleButtons();}
});
syncScaleButtons();
window.addEventListener('pagehide',()=>{if(sourceUrl)URL.revokeObjectURL(sourceUrl);if(resultUrl)URL.revokeObjectURL(resultUrl);});
