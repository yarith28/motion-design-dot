/* Isolated synthetic children prove that an old per-game report cannot certify a new run. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
(async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'small-hours-fresh-')),source=path.resolve(__dirname,'..'),root=path.join(temp,'mini-games');let server;
 try{
  fs.cpSync(source,root,{recursive:true,filter:p=>!p.split(path.sep).includes('coverage')});
  const E=require(path.join(root,'tools/evidence.cjs')),id=E.expansionRooms[0],reportPath=path.join(root,'coverage',id+'.json'),testPath=path.join(root,'tests',id+'.cjs');
  fs.mkdirSync(path.dirname(reportPath),{recursive:true});
  const fixture={passed:true,fixture:true,cases:E.gameIds(id).flatMap(game=>['desktop','mobile-touch'].map(profile=>({id:game,profile,passed:true,outcome:'win',restart:true,edgeCases:['synthetic assertion fixture, not gameplay'],inputMethod:'synthetic fixture, not gameplay',touchOnly:true})))};
  fs.writeFileSync(reportPath,JSON.stringify(fixture));fs.writeFileSync(testPath,'/* Deliberately writes no evidence. */ process.exit(0);\n');
  server=http.createServer((req,res)=>{try{res.end(fs.readFileSync(path.join(temp,decodeURIComponent(req.url))));}catch{res.writeHead(404);res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const run=()=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,[path.join(root,'tools/run-suite.cjs'),id],{env:{...process.env,BASE_URL:'http://127.0.0.1:'+server.address().port,BROWSER_ENGINE:'chromium'},stdio:'pipe'});let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);child.on('error',reject);child.on('close',code=>resolve({code,output,record:JSON.parse(fs.readFileSync(path.join(root,'coverage/suite-runs',id+'.json')))}));});
  let result=await run();assert.equal(result.code,1,result.output);assert.equal(result.record.passed,false);assert.equal(result.record.exitCode,0);assert.equal(fs.existsSync(reportPath),false,'old per-game evidence was removed before child execution');
  fs.writeFileSync(testPath,`/* Fresh synthetic evidence; not an actual gameplay test. */ require('node:fs').writeFileSync(${JSON.stringify(reportPath)},${JSON.stringify(JSON.stringify(fixture))});\n`);
  result=await run();assert.equal(result.code,0,result.output);assert.equal(result.record.passed,true);assert(E.validRun(result.record,id));
  console.log('Fresh-evidence fixtures passed: zero-exit child cannot reuse stale per-game results; freshly emitted complete fixture accepted.');
 }finally{if(server)await new Promise(r=>server.close(r));fs.rmSync(temp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
