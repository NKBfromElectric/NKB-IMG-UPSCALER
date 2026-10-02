export const MAX_SOURCE_PIXELS = 40_000_000;
export const MAX_FILE_BYTES = 30 * 1024 * 1024;
export async function inspectImage(file) {
  if (file.size > MAX_FILE_BYTES) throw new Error('1枚30 MB以下の画像を選んでください。');
  const data = new Uint8Array(await file.slice(0, 256 * 1024).arrayBuffer());
  const view = new DataView(data.buffer);
  let width, height, kind;
  if (data.length >= 24 && [137,80,78,71,13,10,26,10].every((v,i)=>data[i]===v) && view.getUint32(12)===0x49484452) {
    width=view.getUint32(16); height=view.getUint32(20); kind='PNG';
  } else if (data[0]===255 && data[1]===216) {
    kind='JPG'; let i=2;
    while (i+3<data.length) {
      if(data[i++]!==255) throw new Error('JPGの構造を読み取れません。');
      while(data[i]===255)i++;
      const marker=data[i++];
      if(marker===0xda || marker===0xd9)break;
      if(marker===0x01 || (marker>=0xd0 && marker<=0xd7))continue;
      if(i+2>data.length)break;
      const length=view.getUint16(i);
      if(length<2)break;
      if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker) && i+7<=data.length){height=view.getUint16(i+3);width=view.getUint16(i+5);break;}
      i+=length;
    }
  }
  if(!width || !height)throw new Error('画像の形式・サイズを確認できません。別のJPG・PNGをお試しください。');
  if(width*height>MAX_SOURCE_PIXELS || Math.max(width,height)>16384)throw new Error('元画像は4,000万画素・各辺16,384px以下にしてください。');
  return {width,height,kind};
}
