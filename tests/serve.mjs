import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../app/src/main/assets/',import.meta.url));
const files={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/game.js':'game.js'};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
createServer(async(req,res)=>{const file=files[(req.url||'').split('?')[0]];if(!file){res.writeHead(404).end('Not found');return}try{res.writeHead(200,{'Content-Type':types[path.extname(file)]});res.end(await readFile(path.join(root,file)))}catch{res.writeHead(500).end('Build app first')}}).listen(4173,'127.0.0.1',()=>console.log('PLANKO test server: http://127.0.0.1:4173'));
