// Local QA only. Never needed by GitHub Pages.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 4173);
const prefix = '/BIM-PORTIFLIO-/';
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.pdf':'application/pdf','.mp4':'video/mp4'};
http.createServer((req,res)=>{
  let name;
  try { name = decodeURIComponent(new URL(req.url,'http://localhost').pathname); }
  catch { res.writeHead(400).end(); return; }
  if(name==='/'){res.writeHead(302,{Location:prefix}).end();return;}
  if(name.startsWith(prefix)) name = name.slice(prefix.length);
  const target = path.resolve(root, name.replace(/^[/\\]+/,'') || 'index.html');
  if(!target.startsWith(root + path.sep) || !fs.existsSync(target) || !fs.statSync(target).isFile()){res.writeHead(404).end('Not found');return;}
  const size=fs.statSync(target).size;
  const headers={'Content-Type':types[path.extname(target).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
  const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  if(range){
    const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),size-1):size-1;
    if(start>=size || start>end){res.writeHead(416,{'Content-Range':'bytes */'+size}).end();return;}
    res.writeHead(206,{...headers,'Content-Range':'bytes '+start+'-'+end+'/'+size,'Content-Length':end-start+1});
    if(req.method==='HEAD')res.end();else fs.createReadStream(target,{start,end}).pipe(res);
  }else{
    res.writeHead(200,{...headers,'Content-Length':size});
    if(req.method==='HEAD')res.end();else fs.createReadStream(target).pipe(res);
  }
}).listen(port,'127.0.0.1',()=>console.log('Local preview: http://127.0.0.1:'+port+prefix));
