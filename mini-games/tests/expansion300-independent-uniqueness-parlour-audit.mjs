import assert from 'node:assert/strict';
import fs from 'node:fs';
import anchor from '../parlour-room/anchor-stacks.mjs';
import carry from '../parlour-room/carried-road.mjs';
import estate from '../parlour-room/merging-estates.mjs';
import robot from '../parlour-room/crossed-programs.mjs';
const checks=[];
const fresh=e=>{const s={seed:731,rng:731,done:false,log:[]};e.init(s);return s};
const act=(e,s,c)=>{assert(e.actions(s).some(a=>a.code===c),'action must be legal: '+c);e.move(s,c)};
// These hand-built states are post-ordinary structural checks, never ordinary wins.
{
 const s=fresh(carry);s.phase='move';s.b=Array.from({length:25},()=>[]);s.b[12]=[{p:1,t:'F'},{p:2,t:'F'},{p:1,t:'F'},{p:2,t:'F'},{p:1,t:'F'}];
 act(carry,s,'select12');act(carry,s,'carry4');act(carry,s,'dir0');act(carry,s,'drop2');act(carry,s,'drop2');
 // Before committing, this is a plan only; all board pieces remain at source.
 assert.equal(s.b[12].length,5);assert.equal(s.b[13].length,0);
 act(carry,s,'cancel');assert.equal(s.b[12].length,5);checks.push('Uncommitted multi-drop plan and cancellation preserve board state');
 s.b[12]=[{p:1,t:'F'},{p:1,t:'C'}];s.b[13]=[{p:2,t:'W'}];act(carry,s,'select12');act(carry,s,'carry2');act(carry,s,'dir0');assert(!carry.actions(s).some(a=>a.code.startsWith('drop')));act(carry,s,'cancel');act(carry,s,'select12');act(carry,s,'carry1');act(carry,s,'dir0');assert(carry.actions(s).some(a=>a.code==='drop1'));checks.push('Wall cannot receive a mixed carry; only the lone final capstone can flatten it');
}
{
 const s=fresh(anchor);let steps=0;while(!s.done&&steps++<40){const actions=anchor.actions(s);const select=actions.find(a=>a.code.startsWith('s'));if(!select){act(anchor,s,'pass');continue}act(anchor,s,select.code);const move=anchor.actions(s).find(a=>a.code.startsWith('m'));act(anchor,s,move.code);assert.equal(s.b.flat().filter(x=>x===0).length,3);assert(s.b.flat().length<=19)}assert(s.done);checks.push('Anchor counters survive every disconnection; bounded ordinary-action transitions terminate');
}
{
 const s=fresh(estate);s.b=Array(36).fill(-1);s.b[0]=0;s.b[1]=0;s.phase='merger';s.into=0;s.losers=[1];s.lossIndex=0;s.oldPrices={1:2};s.cluster=[2];s.shares=[[1,3,0],[0,4,0]];s.stock=[11,5,12];s.active=0;s.afterMerger=null;
 const stock=()=>[0,1,2].forEach(c=>assert.equal(s.stock[c]+s.shares[0][c]+s.shares[1][c],12));stock();act(estate,s,'trade');stock();act(estate,s,'sell');stock();act(estate,s,'hold');stock();assert.equal(s.phase,'buy');checks.push('Merger trade, sale and opposing settlement conserve each company’s twelve shares');
}
{
 const s=fresh(robot);s.phase='resolve';s.pos=[30,32];s.dir=[1,0];s.life=[3,3];s.progress=[0,0];s.played=[[{cmd:'F2',priority:1}],[{cmd:'W',priority:18}]];s.register=0;
 // C5 is a pit: the first step must remove the robot, preventing a second forward step.
 act(robot,s,'step');assert.equal(s.life[0],2);assert.equal(s.pos[0],43);assert.equal(s.dir[0],0);checks.push('Forward-two pit entry consumes one life, stops remaining movement and respawns after the register');
}
fs.writeFileSync('mini-games/coverage/independent300/uniqueness-parlour-source-audit.json',JSON.stringify({passed:true,phase:'post-ordinary-source-audit',checks,limits:['Hand-built states and assertions supplement public UI campaigns; they do not count as ordinary gameplay evidence.']},null,2));console.log(checks);
