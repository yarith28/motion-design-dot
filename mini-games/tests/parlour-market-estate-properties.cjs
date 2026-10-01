/* Model invariants, not ordinary gameplay or winning-path evidence. */
const assert=require('node:assert/strict');
(async()=>{const market=(await import('../parlour-room/market-of-five.mjs')).default,estate=(await import('../parlour-room/the-other-half.mjs')).default;let markets=0,estates=0;
 for(let seed=1;seed<=80;seed++){
  const s={seed,rng:seed,done:false,log:[]};market.init(s);
  let steps=0;while(!s.done&&steps++<80){const opts=market.actions(s).filter(a=>/^(take:|sell:|camels$)/.test(a.code));assert(opts.length);market.move(s,opts[(seed+steps*7)%opts.length].code);assert(s.hands.every(h=>h.length<=7&&h.every(t=>t>=0&&t<6)));assert(s.herds.every(n=>n>=0));assert(s.points.every(Number.isFinite));if(!s.done)assert.equal(s.market.length,5,'Unsupplied market must end the game');}
  assert(s.done,'Public progressing choices must terminate');assert(['win','loss','draw'].includes(s.outcome));markets++;
 }
 for(let seed=1;seed<=80;seed++){
  const s={seed,rng:seed,done:false,log:[]};estate.init(s);
  for(let round=0;round<6&&!s.done;round++){
   if(s.divider===0){const before=s.round;estate.move(s,'submit');assert.equal(s.round,before,'Empty cut rejected');
    // A single corner/edge cell with connected remainder is a legal, deliberately naive public cut.
    let accepted=false;for(const option of estate.actions(s).filter(a=>a.code.startsWith('cell:'))){estate.move(s,'clear');estate.move(s,option.code);estate.move(s,'submit');if(s.round!==before){accepted=true;break;}}
    assert(accepted,'Every authored estate must admit a connected partition');
   }else{assert(s.mask>0&&s.mask!==s.full);estate.move(s,seed%2?'choose:A':'choose:B');}
   assert(s.score.every(Number.isFinite));assert(s.redraw.every(n=>n>=0&&n<=2));
  }
  assert(s.done&&s.round===6,'Six allocations terminate');estates++;
 }
 console.log(JSON.stringify({passed:true,markets,estates,scope:'Seeded model invariants and termination only; no UI, winning quality, or ordinary play claims.'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
