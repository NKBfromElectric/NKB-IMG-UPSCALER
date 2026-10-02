import {wavHeader,pcm16} from './wav.js';
self.onmessage=({data:{channels,sampleRate}})=>{
 try{const frames=channels[0].length,buffer=wavHeader(frames,channels.length,sampleRate),view=new DataView(buffer);for(let start=0;start<frames;start+=65536){const end=Math.min(frames,start+65536);for(let i=start;i<end;i++)for(let c=0;c<channels.length;c++)view.setInt16(44+(i*channels.length+c)*2,pcm16(channels[c][i]),true);self.postMessage({progress:end/frames});}self.postMessage({buffer},[buffer]);}catch(e){self.postMessage({error:e.message});}
};
