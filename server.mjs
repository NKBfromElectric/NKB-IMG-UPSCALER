import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const files=['index.html','app.js','crop.js','crop-geometry.js','styles.css','geometry.js','favicon.svg','resize.js','input.js','zip.js','privacy.html','terms.html','robots.txt','sitemap.xml','vendor/pica.mjs','vendor/pica-LICENSE.txt'];
const types={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',mjs:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml',txt:'text/plain; charset=utf-8',xml:'application/xml'};
const headerFile=await readFile(new URL('./public/_headers',import.meta.url),'utf8');
const headers=Object.fromEntries(headerFile.split(/\r?\n/).filter(line=>line.startsWith('  ')).map(line=>{const i=line.indexOf(':');return [line.slice(0,i).trim(),line.slice(i+1).trim()];}));
http.createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;const file=path==='/'?'index.html':path.slice(1);if(!files.includes(file)){res.writeHead(404,headers);res.end();return;}const body=await readFile(fileURLToPath(new URL(`./public/${file}`,import.meta.url)));res.writeHead(200,{...headers,'Content-Type':types[file.split('.').pop()]});res.end(body);}catch{res.writeHead(500,headers);res.end('Server error');}}).listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log('Preview ready'));
