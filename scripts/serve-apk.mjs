import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat, writeFile, readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const {version} = JSON.parse(await readFile(new URL('../package.json', import.meta.url),'utf8'));
const filename = `FoodLens-${version}-preview.apk`;
const apk = fileURLToPath(new URL(`../outputs/${filename}`, import.meta.url));
const {size} = await stat(apk);
const token = randomBytes(24).toString('hex');
const downloadPath = `/${token}/${filename}`;
const expiresAt = Date.now() + 24*60*60*1000;
await writeFile(new URL('../outputs/remote-download.json',import.meta.url), JSON.stringify({downloadPath,port:4174,expiresAt:new Date(expiresAt).toISOString()},null,2));
const server = http.createServer((req,res)=>{
 if(Date.now()>=expiresAt){res.writeHead(410);res.end('Download expired');return;}
 let pathname;
 try{pathname=new URL(req.url,'http://localhost').pathname;}catch{res.writeHead(400);res.end();return;}
 if(pathname!==downloadPath){res.writeHead(404);res.end();return;}
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
 const headers={'Content-Type':'application/vnd.android.package-archive','Content-Disposition':`attachment; filename="${filename}"`,'Accept-Ranges':'bytes','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
 let start=0,end=size-1,status=200;
 if(req.headers.range){
  const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
  if(!m || (!m[1]&&!m[2])){res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}
  if(m[1]){start=Number(m[1]);end=m[2]?Math.min(Number(m[2]),end):end;}else{start=Math.max(0,size-Number(m[2]));}
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}
  status=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`;
 }
 headers['Content-Length']=String(end-start+1);
 res.writeHead(status,headers);
 if(req.method==='HEAD'){res.end();return;}
 const stream=createReadStream(apk,{start,end});
 stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
});
server.listen(4174,'127.0.0.1',()=>console.log('APK download service ready on localhost:4174'));
setTimeout(()=>server.close(),24*60*60*1000).unref();
