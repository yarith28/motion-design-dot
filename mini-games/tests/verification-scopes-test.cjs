/* In-memory adversarial schema fixtures; never emits passing gameplay evidence. */
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const{ordinaryCampaigns,openingControls}=require('./verification-scopes.cjs');
const copy=value=>structuredClone(value),digest=text=>crypto.createHash('sha256').update(text).digest('hex');
const oldIds=Array.from({length:100},(_,i)=>'old-'+i),newIds=Array.from({length:100},(_,i)=>'new-'+i),rooms=new Map([...oldIds,...newIds].map((id,i)=>[id,'fixture-room-'+i%3]));
const sourceFiles=new Map(['journey/journey.mjs','journey/journey.css',...Array.from({length:3},(_,i)=>['engines.mjs','index.html','room.css','room.js','games.json','extra.md'].map(file=>'fixture-room-'+i+'/'+file)).flat()].map(file=>[file,digest('Synthetic source '+file)]));
const runtimeFiles=room=>[...sourceFiles.keys()].filter(file=>file.startsWith('journey/')||file.startsWith(room+'/')&&!file.endsWith('.md'));
const options={label:'Synthetic400 ordinary',expectedIds:new Set(oldIds),roomForId:id=>rooms.get(id),runtimeFiles,hashFile:file=>{assert(sourceFiles.has(file),'Unknown synthetic source');return sourceFiles.get(file)}};
function ordinary(ids){return{limits:['Synthetic validation only; not gameplay.'],summary:{uniqueGamesReviewed:6,currentCampaignWins:6,latestSamples:Object.fromEntries(ids.map((id,index)=>[id,index]))},samples:ids.map(id=>{const room=rooms.get(id),hashes=Object.fromEntries([...sourceFiles].filter(([file])=>file.startsWith('journey/')||file.startsWith(room+'/')));return{id,room,fullCampaignWin:true,finiteStudiesObservedWon:[0,1,2],naturalFailureObserved:true,sourceUnchanged:true,browserErrors:[],actions:Array.from({length:11},()=>({synthetic:true})),beforeHashes:copy(hashes),afterHashes:copy(hashes)}})}}
const valid=ordinary(oldIds.slice(0,6)),newOptions={...options,label:'Synthetic500 ordinary',expectedIds:new Set(newIds)};
let accepted=0,rejected=0;
assert.equal(ordinaryCampaigns(valid,options).currentWins,6);accepted++;
assert.equal(ordinaryCampaigns(ordinary(newIds.slice(0,6)),newOptions).currentWins,6);accepted++;
// Real historical reports can include extra Markdown hashes and omit the shared play.css.
assert(valid.samples.every(s=>Object.keys(s.afterHashes).some(f=>f.endsWith('.md'))&&!Object.hasOwn(s.afterHashes,'play.css')));
function ordinaryReject(label,mutate,pattern,validationOptions=options){const report=copy(valid);mutate(report);assert.throws(()=>ordinaryCampaigns(report,validationOptions),pattern,label);rejected++}
ordinaryReject('Literal six counts cannot certify an empty latest map',r=>r.summary.latestSamples={},/exactly six/);
ordinaryReject('Five actual campaigns cannot claim six',r=>delete r.summary.latestSamples['old-5'],/exactly six/);
ordinaryReject('Seven campaigns cannot substitute for the exact six-game review',r=>r.summary.latestSamples['old-6']=0,/exactly six/);
ordinaryReject('The500 batch cannot reuse400 campaigns',()=>{},/outside reviewed batch/,newOptions);
ordinaryReject('Unknown game IDs cannot certify either batch',r=>{delete r.summary.latestSamples['old-0'];r.summary.latestSamples.unknown=0},/outside reviewed batch/);
ordinaryReject('Duplicate selected indices are rejected',r=>r.summary.latestSamples['old-1']=0,/distinct latest sample indices/);
for(const index of[-1,0.5,6,'0'])ordinaryReject('Invalid sample index '+index,r=>r.summary.latestSamples['old-0']=index,/valid sample index/);
ordinaryReject('The indexed sample must belong to its map key',r=>r.samples[0].id='old-90',/indexed game/);
ordinaryReject('The indexed sample must belong to its actual room',r=>r.samples[0].room='fixture-room-2',/sample room/);
ordinaryReject('A six-win summary cannot mask a losing campaign',r=>r.samples[0].fullCampaignWin=false,/full campaign win/);
ordinaryReject('All three finite study wins are required',r=>r.samples[0].finiteStudiesObservedWon=[0,1],/all three finite studies/);
ordinaryReject('Natural failure evidence is required',r=>r.samples[0].naturalFailureObserved=false,/natural failure/);
ordinaryReject('Source mutation is rejected',r=>r.samples[0].sourceUnchanged=false,/source unchanged/);
ordinaryReject('Browser errors are rejected',r=>r.samples[0].browserErrors=['Synthetic pageerror'],/browser errors/);
ordinaryReject('The ordinary action record cannot be empty',r=>r.samples[0].actions=[],/recorded ordinary actions/);
ordinaryReject('Declared unique games are derived from selected evidence',r=>r.summary.uniqueGamesReviewed=99,/derived unique campaign count/);
ordinaryReject('Declared current wins are derived from selected evidence',r=>r.summary.currentCampaignWins=99,/derived current campaign wins/);
ordinaryReject('Disclosed limits are required',r=>r.limits=[],/disclosed limits/);
ordinaryReject('Empty matching before and after hash maps are rejected',r=>{r.samples[0].beforeHashes={};r.samples[0].afterHashes={}},/nonempty beforeHashes/);
ordinaryReject('Before and after hashes must match',r=>r.samples[0].beforeHashes['journey/journey.mjs']=digest('Changed synthetic source'),/before\/after source binding/);
for(const file of runtimeFiles('fixture-room-0'))ordinaryReject('Required runtime hash '+file,r=>{delete r.samples[0].beforeHashes[file];delete r.samples[0].afterHashes[file]},/missing runtime binding/);
ordinaryReject('Malformed hashes are rejected',r=>{r.samples[0].beforeHashes['journey/journey.mjs']='bad';r.samples[0].afterHashes['journey/journey.mjs']='bad'},/SHA256 source binding/);
ordinaryReject('Valid-format stale runtime hashes are rejected',r=>{r.samples[0].beforeHashes['journey/journey.mjs']=digest('Stale source');r.samples[0].afterHashes['journey/journey.mjs']=digest('Stale source')},/stale ordinary source/);
ordinaryReject('Recorded extra Markdown snapshots are also current',r=>{r.samples[0].beforeHashes['fixture-room-0/extra.md']=digest('Stale extra');r.samples[0].afterHashes['fixture-room-0/extra.md']=digest('Stale extra')},/stale ordinary source/);
for(const file of['../outside.mjs','/outside.mjs','fixture-room-0/../outside.mjs','fixture-room-0\\..\\outside.mjs'])ordinaryReject('Unsafe recorded source path '+file,r=>{r.samples[0].beforeHashes[file]=digest('Unsafe source');r.samples[0].afterHashes[file]=digest('Unsafe source')},/relative source path/);

const metadata=[...oldIds,...newIds].map(id=>({id,smoke:{actionSelector:'#board [data-action="'+id+'"]'}})),seeds=[0,1,20261002,4294967295],profiles=['desktop-mouse','mobile-touch'];
const opening={passed:true,games:200,seeds,errors:[],cases:metadata.flatMap(game=>profiles.flatMap(profile=>seeds.map(seed=>({id:game.id,profile,seed,selector:game.smoke.actionSelector,enabled:true,nativeAction:true,feedbackChanged:true}))))};
assert.equal(openingControls(opening,{metadata}).cases,1600);accepted++;
const reordered=copy(opening);reordered.cases.reverse();assert.equal(openingControls(reordered,{metadata}).cases,1600);accepted++;
function openingReject(label,mutate,pattern,validationMetadata=metadata){const report=copy(opening);mutate(report);assert.throws(()=>openingControls(report,{metadata:validationMetadata}),pattern,label);rejected++}
openingReject('1600 copies of one case cannot claim Cartesian coverage',r=>r.cases=Array.from({length:1600},()=>copy(r.cases[0])),/Duplicate opening tuple/);
openingReject('One duplicate cannot replace an omitted tuple',r=>r.cases[1599]=copy(r.cases[0]),/Duplicate opening tuple/);
openingReject('All1600 tuples are required',r=>r.cases.pop(),/Exact opening case count/);
openingReject('Unknown opening games are rejected',r=>r.cases[0].id='unknown',/Unknown opening game/);
openingReject('Unknown input profiles are rejected',r=>r.cases[0].profile='mobile-mouse',/unknown opening input profile/);
for(const seed of[2,'0',-1,4294967296])openingReject('Unknown replay seed '+seed,r=>r.cases[0].seed=seed,/unknown opening seed/);
openingReject('Malformed case records are rejected',r=>r.cases[0]=null,/Opening case record/);
openingReject('Disabled controls are rejected',r=>r.cases[0].enabled=false,/enabled opening control/);
openingReject('Synthetic actions cannot substitute for native input',r=>r.cases[0].nativeAction=false,/native opening input/);
openingReject('No-op controls are rejected',r=>r.cases[0].feedbackChanged=false,/meaningful opening feedback/);
openingReject('The tested selector must match the actual game manifest',r=>r.cases[0].selector='#restart',/tested manifest opening selector/);
openingReject('Missing tested selectors are rejected',r=>delete r.cases[0].selector,/tested manifest opening selector/);
const badMetadata=copy(metadata);badMetadata[0].smoke.actionSelector='#restart';openingReject('Restart cannot be the manifest gameplay selector',()=>{},/manifest gameplay selector/,badMetadata);
openingReject('The declared game count cannot hide missing games',r=>r.games=100,/Opening game count/);
openingReject('Replay seed declarations must match the tested set',r=>r.seeds=[0,1],/Opening replay seed coverage/);
openingReject('Opening browser errors are rejected',r=>r.errors=['Synthetic pageerror'],/Opening browser errors/);
openingReject('A failed opening report is rejected',r=>r.passed=false,/Opening regression passed/);
const duplicateMetadata=copy(metadata);duplicateMetadata[199]=copy(duplicateMetadata[0]);openingReject('Duplicate metadata cannot shrink expected coverage',()=>{},/Distinct opening metadata IDs/,duplicateMetadata);
console.log(JSON.stringify({passed:true,acceptedFixtures:accepted,rejectedAdversarialFixtures:rejected,scope:'Synthetic validation fixtures only. No gameplay reports were produced or modified.'}));
