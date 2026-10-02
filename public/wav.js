export function wavHeader(frames,channels,sampleRate){
  if(!Number.isInteger(frames)||frames<1||![1,2].includes(channels)||!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>96000||frames*channels*2>256*1024*1024)throw new Error('WAVのサイズが上限を超えています。');
  const dataBytes=frames*channels*2,buffer=new ArrayBuffer(44+dataBytes),view=new DataView(buffer);
  const text=(offset,value)=>{for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i));};
  text(0,'RIFF');view.setUint32(4,36+dataBytes,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*channels*2,true);view.setUint16(32,channels*2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,dataBytes,true);return buffer;
}
export function pcm16(value){const n=Number.isFinite(value)?Math.max(-1,Math.min(1,value)):0;return Math.round(n<0?n*32768:n*32767);}
