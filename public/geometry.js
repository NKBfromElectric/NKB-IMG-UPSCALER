export const MAX_PIXELS = 40_000_000;
export function stepScale(value, delta) {
  const base = Number.isFinite(value) && value >= 2 && value <= 10 ? value : 2;
  return Math.min(10, Math.max(2, Math.round((base + delta) * 10) / 10));
}
export function dimensions(width, height, scale) {
  if (![width,height,scale].every(Number.isFinite) || width<=0 || height<=0 || scale<2 || scale>10) throw new Error('倍率は2〜10倍で指定してください。');
  const w=Math.round(width*scale),h=Math.round(height*scale);
  return {width:w,height:h,allowed:w*h<=MAX_PIXELS && w<=16384 && h<=16384};
}
