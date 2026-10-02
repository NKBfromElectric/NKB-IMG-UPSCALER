const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
export function normalizeCrop(rect,width,height){
  const w=clamp(Math.round(rect.width)||1,1,width),h=clamp(Math.round(rect.height)||1,1,height);
  return {x:clamp(Math.round(rect.x)||0,0,width-w),y:clamp(Math.round(rect.y)||0,0,height-h),width:w,height:h};
}
export function centeredCrop(width,height,ratio=0){
  if(!ratio)return {x:0,y:0,width,height};
  const w=Math.min(width,height*ratio),h=w/ratio;
  return normalizeCrop({x:(width-w)/2,y:(height-h)/2,width:w,height:h},width,height);
}
export function cropFromPoints(start,end,width,height,ratio=0){
  const sx=clamp(start.x,0,width),sy=clamp(start.y,0,height);
  const directionX=end.x>=sx?1:-1,directionY=end.y>=sy?1:-1;
  let w=Math.max(1,Math.abs(end.x-sx)),h=Math.max(1,Math.abs(end.y-sy));
  const maxW=directionX>0?width-sx:sx,maxH=directionY>0?height-sy:sy;
  if(ratio){if(w/h>ratio)h=w/ratio;else w=h*ratio;const factor=Math.min(1,maxW/w,maxH/h);w*=factor;h*=factor;}
  else {w=Math.min(w,maxW);h=Math.min(h,maxH);}
  return normalizeCrop({x:directionX>0?sx:sx-w,y:directionY>0?sy:sy-h,width:w,height:h},width,height);
}
export function cropRatio(value,width,height){
  if(value==='spotify')return 7/3;
  if(value==='original')return width/height;
  if(value==='free')return 0;
  const [w,h]=value.split(':').map(Number);return w>0&&h>0?w/h:0;
}
