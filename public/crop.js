import {normalizeCrop,centeredCrop,cropFromPoints,cropRatio} from './crop-geometry.js';
import {resizeImage} from './resize.js';

export function createCropEditor({getItem,isLocked,setProcessing}){
  const $=id=>document.getElementById(id),surface=$('crop-surface'),box=$('crop-box');
  let enabled=false,drag=null,drawing=false,lastItem=null;
  const ratio=item=>cropRatio(item.cropRatio||'free',item.width,item.height);
  function clearResult(item){if(item.cropResult)URL.revokeObjectURL(item.cropResult.url);item.cropResult=null;}
  function layout(){
    const item=getItem();if(!enabled||!item)return;
    const canvas=document.querySelector('.compare-canvas');const r=canvas.getBoundingClientRect();
    const scale=Math.min(r.width/item.width,r.height/item.height);
    surface.style.width=`${item.width*scale}px`;surface.style.height=`${item.height*scale}px`;
    surface.style.left=`${(r.width-item.width*scale)/2}px`;surface.style.top=`${(r.height-item.height*scale)/2}px`;
    const c=item.crop;box.style.left=`${c.x/item.width*100}%`;box.style.top=`${c.y/item.height*100}%`;box.style.width=`${c.width/item.width*100}%`;box.style.height=`${c.height/item.height*100}%`;
  }
  function refresh(active=enabled){
    enabled=active;const item=getItem();if(!enabled||item!==lastItem)drawing=false;lastItem=item;surface.hidden=!enabled||!item;box.hidden=drawing;
    $('crop-process').disabled=isLocked()||!item||drawing;$('crop-reset').disabled=isLocked()||!item;$('crop-new').disabled=isLocked()||!item;
    $('crop-quality-row').hidden=$('crop-format').value!=='image/jpeg';
    $('crop-download').hidden=!item?.cropResult;
    if(!item){$('crop-size').textContent='— × —';$('crop-status').textContent='画像を選択すると、切り抜けます。';return;}
    item.crop??=centeredCrop(item.width,item.height);item.cropRatio??='free';
    $('crop-ratio').value=item.cropRatio;
    $('spotify-export').hidden=item.cropRatio!=='spotify';
    $('twitter-export').hidden=item.cropRatio!=='twitter';
    for(const key of ['x','y','width','height']){$('crop-'+key).value=item.crop[key];$('crop-'+key).max=key==='x'?item.width-1:key==='y'?item.height-1:key==='width'?item.width:item.height;}
    $('crop-size').textContent=`${item.crop.width.toLocaleString()} × ${item.crop.height.toLocaleString()} px`;
    $('crop-status').classList.remove('error');$('crop-status').textContent=drawing?'画像上をドラッグして、新しい範囲を指定してください。':item.cropResult?'完成しました。切り抜いた画像を保存できます。':'枠の内側は移動、四隅はサイズ変更。「範囲を描き直す」で新しく指定できます。';
    if(item.cropResult){$('crop-download').href=item.cropResult.url;$('crop-download').download=item.cropResult.name;}
    layout();
  }
  function change(rect){drawing=false;const item=getItem();if(!item)return;item.crop=normalizeCrop(rect,item.width,item.height);clearResult(item);refresh();}
  function point(event){const r=surface.getBoundingClientRect(),item=getItem();return {x:(event.clientX-r.left)/r.width*item.width,y:(event.clientY-r.top)/r.height*item.height};}
  surface.addEventListener('pointerdown',event=>{
    if(!enabled||isLocked()||event.button!==0||drag)return;event.preventDefault();const item=getItem(),p=point(event),c=item.crop,corner=event.target.closest('[data-corner]')?.dataset.corner;
    if(drawing){drawing=false;drag={type:'resize',anchor:p,pointer:event.pointerId};change(cropFromPoints(p,p,item.width,item.height,ratio(item)));}
    else if(corner){drag={type:'resize',anchor:{x:corner.includes('w')?c.x+c.width:c.x,y:corner.includes('n')?c.y+c.height:c.y},pointer:event.pointerId};}
    else if(event.target.closest('#crop-box')){drag={type:'move',start:p,rect:{...c},pointer:event.pointerId};}
    else{drag={type:'resize',anchor:p,pointer:event.pointerId};change(cropFromPoints(p,p,item.width,item.height,ratio(item)));}
    surface.setPointerCapture(event.pointerId);
  });
  surface.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.pointer)return;const item=getItem(),p=point(event);
    change(drag.type==='move'?{...drag.rect,x:drag.rect.x+p.x-drag.start.x,y:drag.rect.y+p.y-drag.start.y}:cropFromPoints(drag.anchor,p,item.width,item.height,ratio(item)));
  });
  for(const eventName of ['pointerup','pointercancel','lostpointercapture'])surface.addEventListener(eventName,()=>{drag=null;});
  box.addEventListener('keydown',event=>{
    if(isLocked()||!enabled||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();const item=getItem(),c=item.crop,step=event.shiftKey?10:1;
    const dx=event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0,dy=event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0,corner=event.target.dataset.corner;
    if(corner){const anchor={x:corner.includes('w')?c.x+c.width:c.x,y:corner.includes('n')?c.y+c.height:c.y};const end={x:(corner.includes('w')?c.x:c.x+c.width)+dx,y:(corner.includes('n')?c.y:c.y+c.height)+dy};change(cropFromPoints(anchor,end,item.width,item.height,ratio(item)));}
    else change({...c,x:c.x+dx,y:c.y+dy});
  });
  $('crop-ratio').addEventListener('change',()=>{const item=getItem();if(!item)return;item.cropRatio=$('crop-ratio').value;change(centeredCrop(item.width,item.height,ratio(item)));});
  $('crop-reset').addEventListener('click',()=>{const item=getItem();drawing=false;if(item)change(centeredCrop(item.width,item.height,ratio(item)));});
  $('crop-new').addEventListener('click',()=>{if(isLocked()||!getItem())return;drawing=true;refresh();});
  $('spotify-preset').addEventListener('click',()=>{if(isLocked())return;$('crop-ratio').value='spotify';$('crop-ratio').dispatchEvent(new Event('change'));});
  $('twitter-preset').addEventListener('click',()=>{if(isLocked())return;$('crop-ratio').value='twitter';$('crop-ratio').dispatchEvent(new Event('change'));});
  for(const key of ['x','y','width','height'])$('crop-'+key).addEventListener('change',()=>{
    const item=getItem();if(!item)return;const value=Number($('crop-'+key).value);if(!Number.isFinite(value)){refresh();return;}const c={...item.crop,[key]:value},r=ratio(item);
    if(r&&(key==='width'||key==='height')){if(key==='width'){c.width=Math.min(Math.max(1,value),item.width,item.height*r);c.height=c.width/r;}else{c.height=Math.min(Math.max(1,value),item.height,item.width/r);c.width=c.height*r;}}
    change(c);
  });
  for(const key of ['crop-format','crop-quality','spotify-size','twitter-size'])$(key).addEventListener('change',()=>{const item=getItem();if(item)clearResult(item);$('crop-quality-row').hidden=$('crop-format').value!=='image/jpeg';refresh();});
  $('crop-process').addEventListener('click',async()=>{
    const item=getItem();if(!item||isLocked()||drawing)return;const rect={...item.crop},format=$('crop-format').value,quality=Math.min(1,Math.max(.5,Number($('crop-quality').value)/100||.98)),spotify=item.cropRatio==='spotify'&&$('spotify-size').checked,twitter=item.cropRatio==='twitter'&&$('twitter-size').checked;
    setProcessing(true);$('crop-status').textContent='切り抜いた画像を書き出しています…';const image=new Image(),canvas=document.createElement('canvas'),output=document.createElement('canvas');
    try{image.src=item.url;await image.decode();canvas.width=rect.width;canvas.height=rect.height;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('この端末では画像を処理できません。');if(format==='image/jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);}ctx.drawImage(image,rect.x,rect.y,rect.width,rect.height,0,0,rect.width,rect.height);
      let target=canvas;if(spotify||twitter){output.width=spotify?2660:1500;output.height=spotify?1140:500;await resizeImage(canvas,output,{jpeg:format==='image/jpeg'});target=output;}
      const blob=await new Promise(resolve=>target.toBlob(resolve,format,quality));if(!blob||blob.type!==format)throw new Error('書き出しに失敗しました。範囲を小さくしてお試しください。');clearResult(item);const base=item.file.name.replace(/\.[^.]+$/,'').replace(/[\\/\x00-\x1f]/g,'_').slice(0,180);item.cropResult={url:URL.createObjectURL(blob),name:`${base}_${spotify?'spotify':twitter?'twitter':'crop'}_${target.width}x${target.height}.${format==='image/png'?'png':'jpg'}`};setProcessing(false);refresh();$('crop-status').textContent=`完成しました。${target.width.toLocaleString()} × ${target.height.toLocaleString()} px / ${(blob.size/1024/1024).toFixed(2)} MB`;
    }catch(error){setProcessing(false);refresh();$('crop-status').textContent=error.message;$('crop-status').classList.add('error');}finally{image.src='';canvas.width=canvas.height=output.width=output.height=0;}
  });
  new ResizeObserver(layout).observe(document.querySelector('.compare-canvas'));
  return {refresh,clearResult};
}
