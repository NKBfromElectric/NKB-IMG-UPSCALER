import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const files = {'/':'index.html','/app.js':'app.js','/styles.css':'styles.css','/geometry.js':'geometry.js','/favicon.svg':'favicon.svg'};
const types = {html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml'};
http.createServer(async(req,res)=>{try{const file=files[new URL(req.url,'http://localhost').pathname]; if(!file){res.writeHead(404);res.end();return;} const body=await readFile(fileURLToPath(new URL(`./public/${file}`,import.meta.url)));res.writeHead(200,{'Content-Type':types[file.split('.').pop()]});res.end(body);}catch{res.writeHead(500);res.end('Server error');}}).listen(4173,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4173'));
