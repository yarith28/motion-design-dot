/* Run a real suite against byte-matched source; never attest a partial or stale run. */
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const E=require('./evidence.cjs'),id=process.argv[2];
if(!E.suites[id]){console.error('Usage: node mini-games/tools/run-suite.cjs <'+Object.keys(E.suites).join('|')+'>');process.exit(2);}
for(const name of E.partialOptions)if(process.env[name]){console.error('Unset '+name+' for a full evidence run.');process.exit(2);}
const dest=path.join(E.root,'coverage','suite-runs');fs.mkdirSync(dest,{recursive:true});const file=path.join(dest,id+'.json');
const baseURL=(process.env.BASE_URL||'http://127.0.0.1:8790').replace(/\/$/,'');
const source=E.fingerprint(id),runtime=E.runtimeFingerprint(id),startedAt=new Date().toISOString();
const executable=process.env.CHROMIUM_PATH||'/usr/bin/chromium',version=spawnSync(executable,['--version'],{encoding:'utf8'});
const report={schemaVersion:2,suite:id,passed:false,status:'running',startedAt,source,requestedBaseURL:baseURL,browser:{engine:'Chromium',version:version.status===0?version.stdout.trim():'unknown',executable},scope:E.scope(id),games:E.gameIds(id),limits:['Mobile is Chromium viewport/touch emulation, not Safari or a physical device.','Solver completions do not establish human difficulty or accessibility.']};
const write=()=>fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');write();
async function verifyServed(){for(let n=0;n<runtime.files.length;n+=6)await Promise.all(runtime.files.slice(n,n+6).map(async name=>{const url=baseURL+'/mini-games/'+name;const response=await fetch(url,{signal:AbortSignal.timeout(15000),cache:'no-store'});if(!response.ok)throw Error('Asset verification HTTP '+response.status+': '+url);const bytes=Buffer.from(await response.arrayBuffer());if(!bytes.equals(fs.readFileSync(path.join(E.root,name))))throw Error('Served asset does not match source: '+url);}));return {baseURL,passed:true,sha256:runtime.sha256,fileCount:runtime.files.length,verifiedAt:new Date().toISOString()};}
(async()=>{try{
 report.servedRuntimeBefore=await verifyServed();write();
 const result=spawnSync(process.execPath,[path.join(E.root,'tests',id+'.cjs')],{cwd:path.dirname(E.root),env:{...process.env,BASE_URL:baseURL},stdio:'inherit'});
 report.exitCode=result.status;report.signal=result.signal;report.error=result.error?.message;report.sourceUnchanged=E.fingerprint(id).sha256===source.sha256;
 if(result.status===0&&report.sourceUnchanged)report.servedRuntime=await verifyServed();
 report.finishedAt=new Date().toISOString();report.passed=result.status===0&&report.sourceUnchanged&&version.status===0&&report.browser.version!=='unknown'&&report.servedRuntime?.passed===true;
 report.status=report.passed?'passed':'failed';
}catch(error){report.error=String(error);report.finishedAt=new Date().toISOString();report.status='failed';report.passed=false;}
 write();console.log(JSON.stringify({suite:id,passed:report.passed,error:report.error,evidence:path.relative(path.dirname(E.root),file),sourceUnchanged:report.sourceUnchanged}));process.exit(report.passed?0:1);
})();
