/* Independent finite-state checks of generated studies, including deterministic fallback paths. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../puzzle-lab/engines.js'),'utf8');
const range=n=>Array.from({length:n},(_,i)=>i),popcount=x=>x.toString(2).replace(/0/g,'').length;
function load(random=Math.random){const math=Object.create(Math);math.random=random;const context={window:{},Math:math};vm.createContext(context);vm.runInContext(source,context);return context.window.PuzzleEngines;}
function reached(n,edges,off=0){const seen=new Set([0]),queue=[0];for(let k=0;k<queue.length;k++)for(const[a,b]of edges){const q=a===queue[k]?b:b===queue[k]?a:-1;if(q>=0&&!(off>>q&1)&&!seen.has(q)){seen.add(q);queue.push(q);}}return seen;}
function minCut(m){for(let count=0;count<=m.budget;count++)for(let bits=0;bits<1<<(m.n-2);bits++)if(popcount(bits)===count&&!reached(m.n,m.edges,bits<<1).has(m.n-1))return count;return Infinity;}
function flowCut(m){let best=Infinity;for(let bits=0;bits<1<<(m.n-2);bits++){const left=(bits<<1)|1,cost=m.edges.reduce((total,[a,b,w])=>total+((left>>a&1)&&!(left>>b&1)?w:0),0);best=Math.min(best,cost);}return best;}
function grow(bits,n){const cells=range(n).map(i=>Boolean(bits&(1<<i)));return cells.reduce((mask,alive,i)=>{const neighbors=Number(cells[(i+n-1)%n])+Number(cells[(i+1)%n]);return mask|((alive?neighbors===1:neighbors===2)?1<<i:0);},0);}
function gardenCost(m,first){let states=new Map([[m.initial,0]]);for(let day=0;day<m.days;day++){const next=new Map();for(const[bits,cost]of states){const choices=day===0&&first!==undefined?[first]:[-1,...range(m.n)];for(const i of choices){const used=cost+Number(i>=0);if(used>m.budget)continue;const result=grow(i<0?bits:bits^(1<<i),m.n);if(used<(next.get(result)??Infinity))next.set(result,used);}}states=next;}return states.get(m.target)??Infinity;}
function ferryShortest(m){const n=m.names.length,final=(1<<n)-1,queue=[[0,0,0]],seen=new Set(['0:0']);for(let k=0;k<queue.length;k++){const[bits,boat,dist]=queue[k];if(bits===final)return dist;for(let cargo=0;cargo<=final;cargo++){if(popcount(cargo)>m.capacity)continue;if(range(n).some(i=>(cargo>>i&1)&&((bits>>i&1)!==boat)))continue;const next=bits^cargo,side=1-boat,key=next+':'+side;if(seen.has(key)||m.conflicts.some(([a,b])=>(next>>a&1)===(next>>b&1)&&(next>>a&1)!==side))continue;seen.add(key);queue.push([next,side,dist+1]);}}return Infinity;}
const ids=['seed-tomorrow','circuit-break','river-capacity','safety-ferry','map-inks'];
const report={suite:'puzzle-generation-regression',passed:false,randomCases:0,deterministicCases:0,validatedFallbackCases:0,gardenFallbackSeedCases:0,limits:['Finite-state guarantees measure reachability and minimum interventions/cut/crossings, not human difficulty.','Random sample plus deterministic fallback paths; not exhaustive generator seeds.'],timings:{}};
function check(id,m,stage){
 if(id==='seed-tomorrow'){
  assert.equal(gardenCost(m),2+stage);assert.equal(m.minimumInterventions,m.budget);assert.equal(m.day,0);assert.equal(m.used,0);
  const choices=[-1,...range(m.n)].map(i=>gardenCost(m,i)<=m.budget);assert.ok(choices.some(Boolean)&&choices.some(v=>!v),'at least one viable and one losing first-day fork');
  let nonlinear=false,orderMatters=false;for(let a=0;a<m.n;a++)for(let b=0;b<m.n;b++){
   if(grow((1<<a)^(1<<b),m.n)!==(grow(1<<a,m.n)^grow(1<<b,m.n)))nonlinear=true;
   if(grow(grow(m.initial^(1<<a),m.n)^(1<<b),m.n)!==grow(grow(m.initial^(1<<b),m.n)^(1<<a),m.n))orderMatters=true;
  }assert.ok(nonlinear&&orderMatters,'growth and temporally swapped interventions are not a linear toggle mask');
 }else if(id==='circuit-break'){
  assert.equal(reached(m.n,m.edges).size,m.n);assert.equal(minCut(m),stage+1);assert.ok(m.edges.filter(e=>e.includes(0)).length>m.budget);assert.ok(m.edges.filter(e=>e.includes(m.n-1)).length>m.budget);
 }else if(id==='river-capacity'){
  assert.equal(flowCut(m),m.target);assert.ok(m.target>=3+stage);assert.ok(m.target<m.edges.filter(e=>e[0]===0).reduce((a,e)=>a+e[2],0));assert.ok(m.target<m.edges.filter(e=>e[1]===m.n-1).reduce((a,e)=>a+e[2],0));assert.ok(m.edges.every(([a,b,w])=>a<b&&w>0));
 }else if(id==='safety-ferry'){
  assert.equal(ferryShortest(m),7+stage*2);assert.equal(m.capacity,stage===2?3:2);
 }else{
  assert.equal(reached(m.n,m.edges).size,m.n);let triangle=false;const edge=(a,b)=>m.edges.some(([x,y])=>(x===a&&y===b)||(x===b&&y===a));for(let a=0;a<m.n;a++)for(let b=a+1;b<m.n;b++)for(let c=b+1;c<m.n;c++)if(edge(a,b)&&edge(b,c)&&edge(a,c))triangle=true;assert.ok(triangle,'three inks required');
 }
}
try{
 report.arrowAudit=require('./puzzle-arrow-audit-regression.cjs').runModelChecks();
 const engines=load(),samples=Number(process.env.GENERATOR_SAMPLES||20);
 for(const id of ids){const start=Date.now(),signatures=new Set();for(let stage=0;stage<3;stage++)for(let i=0;i<samples;i++){const m=engines[id].init(stage);check(id,m,stage);signatures.add(JSON.stringify(m.edges||m.conflicts||[m.initial,m.target]));report.randomCases++;}assert.ok(signatures.size>3,id+' has actual generated variety');report.timings[id]=Date.now()-start;}
 // Constant zero drives cut/flow/ferry random attempts into rejection, exercising their bounded fallbacks.
 const deterministic=load(()=>0);for(const id of ids)for(let stage=0;stage<3;stage++){const m=deterministic[id].init(stage);check(id,m,stage);if(['circuit-break','river-capacity','safety-ferry'].includes(id))assert.match(m.generation,/fallback/);report.deterministicCases++;if(['circuit-break','river-capacity','safety-ferry'].includes(id))report.validatedFallbackCases++;}
 for(let stage=0;stage<3;stage++){const n=7+stage,initial=[112,223,234][stage],engine=load(()=>(initial-1)/((1<<n)-2)),m=engine['seed-tomorrow'].init(stage);assert.equal(m.initial,initial);check('seed-tomorrow',m,stage);report.gardenFallbackSeedCases++;}
 report.passed=true;
}catch(e){report.failure=String(e.stack||e);process.exitCode=1;}
const output=process.env.REPORT_PATH||path.join(__dirname,'../coverage/puzzle-generation-regression.json');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
