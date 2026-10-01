/* Authored-state rule regressions. These are NOT ordinary play or UI winning evidence. */
import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const room=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../parlour-room');let checks=0;
async function internals(id,names){let source=fs.readFileSync(path.join(room,id+'.mjs'),'utf8').replace(/from '\.\/(.*?)'/g,(_,f)=>`from '${new URL('file://'+path.join(room,f))}'`);source+='\nexport {'+names.join(',')+'};';return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));}
const fresh=g=>{const s={seed:731,rng:731,done:false,log:[]};g.init(s);return s;};
{
 const m=await internals('breathing-room',['apply','score']);const s=fresh(m.default);s.b[8]=-1;for(const i of[1,7,9])s.b[i]=1;const q=m.apply(s,15,1);assert.equal(q.cap,1);assert.equal(q.b[8],0);s.history.push(q.b.join(','));assert.equal(m.apply(s,15,1),null,'Superko forbids prior board');s.b=Array(49).fill(0);for(const i of[1,7,9,15])s.b[i]=-1;assert.equal(m.apply(s,8,1),null,'Uncapturing suicide forbidden');checks+=3;
}
{
 const m=await internals('corner-garden',['placeCells']);let b=Array(100).fill(0);b[0]=1;assert.equal(m.placeCells(b,1,[[0,0]],1),null);assert.deepEqual(m.placeCells(b,1,[[0,0]],11),[11]);assert.equal(m.placeCells(b,1,[[0,0]],99),null);checks+=3;
}
{
 const m=await internals('twin-roofs',['free','pairs']);for(let n=0;n<100;n++){const s={seed:731+n*7919,rng:731+n*7919,log:[]};m.default.init(s);assert.equal(s.tiles.length,48);assert(m.pairs(s).length);for(let k=0;k<12;k++)assert.equal(s.tiles.filter(t=>t.kind===k).length,4);}const s={tiles:[{x:0,y:0,z:0,live:true},{x:0,y:0,z:1,live:true}]};assert(!m.free(s,0));assert(m.free(s,1));checks+=102;
}
{
 const m=await internals('ascending-expeditions',['route','legal']);assert.equal(m.route([{r:0},{r:2},{r:3}]),-30);assert.equal(m.route([]),0);assert(!m.legal([{r:4}],{r:3}));assert(!m.legal([{r:4}],{r:0}));checks+=4;
}
{
 const m=await internals('pass-the-burden',['penalty']);assert.equal(m.penalty([3,4,5,8,9]),11);checks++;
}
{
 const m=await internals('roads-we-share',['feature','claimOptions']);const s=fresh(m.default);s.b[31]=['F','F','R','F'];s.b[49]=['R','F','F','F'];s.claims=[{p:0,i:31,t:'R'}];const f=m.feature(s,40,'R');assert.equal(f.cells.length,3);assert.equal(f.open,0);assert(!m.claimOptions(s,1,49).includes('R'),'Merged claimed road cannot gain new claimant');checks+=3;
}
{
 const m=await internals('factory-mosaic',['take','rows','house']);const s=fresh(m.default);s.fact[0]=[0,0,0,1];m.take(s,0,{src:0,c:0},0);assert.equal(s.rows[0][0].n,1);assert.equal(s.floor[0],2);assert(s.center.includes(1));s.wall[0][2][2]=true;assert(!m.rows(s,0,0).includes(2));const q=fresh(m.default);q.turn=1;q.fact=[[0],[],[],[],[]];q.center=[];q.rows[1][0]={c:0,n:1};m.house(q);assert(!q.log.some(t=>String(t).includes('take 1 Sun to pattern row 1.')),'House must not score an already-complete row again');checks+=5;
}
{
 const m=await internals('anchor-stacks',['apply']);const s={b:Array.from({length:19},()=>[])};s.b[0]=[0];s.b[1]=[1];s.b[18]=[2];m.apply(s,{i:1,j:0});assert.deepEqual(s.b[0],[0,1]);assert.deepEqual(s.b[18],[],'Anchorless disconnected component removed');checks+=2;
}
{
 const m=await internals('four-houses',['tileLegal','leaderLegal','viableLeader']);const s=fresh(m.default);assert(m.tileLegal(s,12,3));assert(!m.tileLegal(s,12,1));assert(!m.tileLegal(s,0,3));assert(m.leaderLegal(s,1));assert(!m.leaderLegal(s,35));s.leaders.find(l=>l.p===0&&l.c===3).pos=1;s.hands[1]=[];assert(!m.viableLeader(s,3,6),'No knowingly losing equal-base attack without support');s.hands[1]=[0];assert(m.viableLeader(s,3,6),'Own support can make attack viable');checks+=7;
}
{
 const m=await internals('carried-road',['simulate','road']);const s=fresh(m.default);s.b[0]=[{p:2,t:'F'},{p:1,t:'C'}];s.b[1]=[{p:2,t:'W'}];assert.equal(m.simulate(s,0,2,0,[2]),null);const q=m.simulate(s,0,1,0,[1]);assert.equal(q.b[1][0].t,'F');assert.equal(q.b[1].at(-1).t,'C');s.b[1]=[{p:2,t:'C'}];assert.equal(m.simulate(s,0,1,0,[1]),null);s.b=Array.from({length:25},()=>[]);for(let i=0;i<5;i++)s.b[i]=[{p:1,t:'F'}];assert(m.road(s,1));s.b[2][0].t='W';assert(!m.road(s,1));checks+=6;
}
{
 const m=await internals('one-last-card',['bots']);const s=fresh(m.default);s.hands=[[7],[3],[4]];s.deck=[1,2,5];s.turn=1;s.known[1][0]=7;s.tokens=[2,0,0];m.bots(s);assert(!s.log.some(x=>String(x).includes('Moss play 3')),'Known losing comparison rejected');assert(s.discard[1].includes(5),'Useful forced redraw chosen instead');checks+=2;
}
{
 const m=await internals('rings-leave-ripples',['moves','apply','idx']);const s=fresh(m.default);s.rings[m.idx(-2,0)]=1;s.markers[m.idx(-1,0)]=2;s.markers[m.idx(0,0)]=1;const move=m.moves(s,1).find(o=>o.j===m.idx(1,0));assert(move);assert(!m.moves(s,1).some(o=>o.j===m.idx(2,0)),'Must stop immediately after marker run');m.apply(s,move,1);assert.equal(s.markers[m.idx(-1,0)],1);assert.equal(s.markers[m.idx(0,0)],2);checks+=4;
}
{
 const m=await internals('orders-at-dusk',['resolve']);
 const scenario=cut=>{const s=fresh(m.default);s.units=[{id:0,p:0,pos:6},{id:1,p:0,pos:4},{id:2,p:1,pos:3},{id:3,p:2,pos:1}];s.orders={0:{type:'move',u:0,to:3},1:{type:'support',u:1,target:0,to:3}};s.botOrders={2:{type:'hold',u:2,to:3},3:{type:cut?'move':'hold',u:3,to:cut?4:1}};m.resolve(s);return s;};
 const cut=scenario(true),supported=scenario(false);assert.equal(cut.units.find(u=>u.id===0).pos,6);assert(cut.report.some(t=>t.includes('CUT')));assert.equal(supported.units.find(u=>u.id===0).pos,3);checks+=3;
}
{
 const m=await internals('river-stakes',[]);const fixture=JSON.parse(fs.readFileSync(path.resolve(room,'../tests/fixtures/parlour-paths.json')))['river-stakes'];for(const f of Object.values(fixture)){const s={seed:f.seed,rng:f.seed,done:false,log:[]};m.default.init(s);for(const c of f.path){m.default.move(s,c);assert.equal(s.cash[0]+s.cash[1]+s.pot,80,'Bet/call/refund/showdown conserve the80chips');assert(s.cash.every(n=>n>=0));}}checks++;
}
{
 const m=await internals('letters-we-cannot-see',['attainable','house','terminal']);const s=fresh(m.default);assert.deepEqual(m.attainable(s),[5,5,5]);s.discard=[{u:2,r:5}];assert.deepEqual(m.attainable(s),[5,5,4]);s.discard=[{u:0,r:1},{u:0,r:1},{u:0,r:1}];assert.deepEqual(m.attainable(s),[0,5,5]);const before=m.attainable(s);s.hands[0][0].card={u:1,r:5};s.deck.reverse();assert.deepEqual(m.attainable(s),before,'Attainable display cannot inspect concealed cards');const q=fresh(m.default);q.hints=0;q.stacks=[1,1,1];q.discard=[{u:1,r:4}];q.hands[0]=[{u:0,r:2},{u:2,r:2},{u:0,r:3},{u:2,r:3}].map(card=>({card,domain:Array.from({length:15},(_,i)=>i)}));q.hands[1][0]={card:{u:1,r:4},domain:[8]};for(let i=1;i<4;i++)q.hands[1][i].card={u:i-1,r:1};m.house(q);assert.equal(q.discard.filter(c=>c.u===1&&c.r===4).length,1,'Partner must preserve its known last useful rank4');const r=fresh(m.default);r.stacks=[5,5,2];assert(!m.terminal(r),'Twelve letters does not finish early');r.final=0;assert(m.terminal(r));assert.equal(r.outcome,'win');const failed=fresh(m.default);failed.stacks=[5,5,2];failed.fuses=0;assert(m.terminal(failed));assert.equal(failed.outcome,'loss','Three fuse errors lose even after reaching12');checks+=8;
}
{
 const m=await internals('ordered-harvest',['endTurn']);const s=fresh(m.default);s.turn=15;s.deck=Array(100).fill(0);m.endTurn(s);assert.equal(s.turn,16);assert(!s.done,'The sixteenth turn must remain playable');m.endTurn(s);assert(s.done,'Sixteen completed turns settle');assert(m.default.view(s).stats.includes('Turn 16/16'));checks+=3;
}
{
 const m=await internals('letters-we-cannot-see',['publicCandidates','house']);const s=fresh(m.default);s.stacks=[2,2,5];s.discard=[{u:2,r:3}];assert.deepEqual(m.publicCandidates(s,[2,7,12]),[{u:0,r:3},{u:1,r:3}],'Public exhausted Cedar3 must leave candidate domains');s.hints=1;s.hands[0]=[{u:0,r:3},{u:1,r:3},{u:0,r:2},{u:0,r:4}].map(card=>({card,domain:[1,2,3,7,12]}));s.hands[1]=[{u:0,r:4},{u:1,r:4},{u:0,r:5},{u:1,r:5}].map(card=>({card,domain:[card.u*5+card.r-1]}));m.house(s);assert(s.log.some(t=>String(t).includes('House hint rank 3.')),'Public elimination must enable safe rank3 hint');checks+=2;
}
{
 const m=await internals('masks-and-coins',['startHouse']);for(let seed=1;seed<=20;seed++){const s=fresh(m.default);s.rng=seed;s.hands[1]=['Guard','Assassin'];s.coins[1]=2;s.blockHistory={aid:1};const q=structuredClone(s);q.hands[0]=['Guard','Guard'];m.startHouse(s);m.startHouse(q);assert.notEqual(s.pending.act,'aid','Do not repeat publicly blocked Aid');assert.equal(s.pending.act,q.pending.act,'Hidden human roles cannot change house choice');}checks+=40;
}
{
 const {default:words}=await import('../parlour-room/lexicon.mjs');const {default:familiar}=await import('../parlour-room/familiar-lexicon.mjs');for(const w of ['MINE','RING','INNER','VET','THIS','MATCHES','DIARIES','LADS','NUTS','MINER','SHRINE','ORAL','EXTENSION','EXTENDS'])assert(words.includes(w),w+' is a familiar legal word');for(const w of ['HM','MM','EH','DE'])assert(!familiar.includes(w),'Opponent avoids unfamiliar short filler: '+w);assert.equal(new Set(words).size,words.length);checks+=19;
}
{
 const m=await internals('masks-and-coins',[]);for(let seed=1;seed<=20;seed++){const s=fresh(m.default);s.rng=seed;s.hands=[['Captain'],['Treasurer']];s.coins[0]=3;m.default.move(s,'assassinate');assert(s.log.some(t=>t.includes('House challenges your action.')),'Lethal assassination without Guard must be challenged');assert.equal(s.phase,'lose');}const s=fresh(m.default);s.phase='exchange';s.pending={p:0,act:'exchange'};s.exchange=['Captain','Guard','Envoy','Treasurer'];s.keep=[0,3];m.default.move(s,'kept');assert.deepEqual(s.hands[0],['Captain','Treasurer']);assert.notEqual(s.phase,'exchange','Finish exchange must dispatch instead of toggling a NaN index');checks+=22;
}
{
 const m=await internals('veiled-standard',['publicDanger']);const s=fresh(m.default);s.units=[{id:'H',p:2,t:'Y',pos:1,live:true,reveal:false},{id:'HF',p:2,t:'F',pos:0,live:true},{id:'I',p:1,t:'4',pos:13,live:true,reveal:true},{id:'IF',p:1,t:'F',pos:35,live:true,reveal:false}];assert(m.publicDanger(s,{u:'H',j:7,d:1})>100);assert.equal(m.publicDanger(s,{u:'H',j:2,d:1}),0);s.units[2].reveal=false;assert.equal(m.publicDanger(s,{u:'H',j:7,d:1}),0,'Do not inspect unrevealed hostile identity');s.units[2].reveal=true;s.units[0].t='4';s.units[0].pos=7;assert(m.publicDanger(s,{u:'H',j:13,d:1})>=200,'Avoid last movable unit equal trade');checks+=4;
}
{
 const m=await internals('orders-at-dusk',['botPlan']);for(let seed=1;seed<=20;seed++){const s=fresh(m.default);s.rng=seed;for(const p of [1,2]){const plan=m.botPlan(s,p),dest=Object.values(plan).filter(o=>o.type==='move').map(o=>o.to);assert.equal(new Set(dest).size,dest.length,'A faction must not issue friendly same-destination bounces');}}checks+=40;
}
{
 const m=await internals('four-houses',['finishAction']);const s=fresh(m.default);s.tiles=Array(36).fill(0);s.trigger={kind:'none',regions:[]};m.finishAction(s);assert(s.done,'Fully occupied board settles immediately after resolved conflicts');checks++;
}
{
 const m=await internals('one-last-card',['execute']);const s=fresh(m.default);s.hands=[[6,1],[2],[8]];s.known[1][2]=8;m.execute(s,0,6,2,null);assert.equal(s.known[2][0],8,'Exchange recipient remembers the card handed over');assert.equal(s.known[0][2],1,'Exchange actor remembers retained hand handed over');assert.equal(s.known[1][0],8,'Third-party prior knowledge follows the exchanged card');const q=fresh(m.default);q.hands=[[3,5],[2],[5]];m.execute(q,0,3,2,null);assert(q.alive[0]&&q.alive[2]);assert.equal(q.known[0][2],5);assert.equal(q.known[2][0],5,'Equal comparison reveals both retained cards to its participants');checks+=6;
}
{
 const m=await internals('rings-leave-ripples',[]);const s=fresh(m.default);for(let i=0;i<4;i++)m.default.move(s,m.default.actions(s)[0].code);assert.equal(s.phase,'move');assert.deepEqual(s.history,[s.rings.join('')+'/'+s.markers.join('')+'/2'],'Initial movement position counts toward repetition');checks++;
}
{
 const m=await internals('ascending-expeditions',['house']);const s=fresh(m.default);s.deck=[{u:2,r:5},{u:3,r:5}];s.hands[1]=[{u:0,r:0},{u:0,r:2},{u:0,r:3},{u:0,r:10},{u:1,r:8},{u:1,r:9}];m.house(s);assert(s.routes[1].every(r=>r.length===0),'No fresh expedition can repay20 in the final stock horizon');const q=fresh(m.default);q.deck=[{u:2,r:5}];q.routes[1][0]=[{u:0,r:2},{u:0,r:3}];q.hands[1]=[{u:0,r:4},{u:0,r:10}];m.house(q);assert.equal(q.routes[1][0].at(-1).r,10,'Use the larger legal scoring card when no later play remains');checks+=2;
}
console.log(JSON.stringify({passed:true,checks,classification:'Authored-state rule regressions, no ordinary-play claims'}));
