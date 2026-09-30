const assert=require('node:assert/strict');
const E=require('../afterglow/engine.js');
let trajectories=0;
for(let garden=0;garden<3;garden++){
 const arrangements=new Set();
 for(let variant=0;variant<6;variant++){
  const board=E.create(garden,5,1,variant);
  arrangements.add(JSON.stringify(board.blocks.map(b=>[b.x,b.y,b.kind,b.hp])));
  for(const degrees of [11,12,45,89,90,91,135,168,169]){
   const s=structuredClone(board);E.launch(s,-degrees*Math.PI/180);
   for(let step=0;step<1500&&!s.done;step++){
    E.advance(s,E.STEP);
    s.balls.forEach(b=>{assert.ok([b.x,b.y,b.vx,b.vy].every(Number.isFinite));assert.ok(b.x>=E.R-.01&&b.x<=E.W-E.R+.01)});
    assert.ok(s.blocks.every(b=>b.hp>0));assert.ok(s.orbs<=7);
   }
   assert.equal(s.done,true);assert.equal(s.balls.length,0);assert.equal(s.pending,0);assert.ok(s.origin>=12&&s.origin<=548);trajectories++;
  }
 }
 assert.ok(arrangements.size>=3,'Runs should have genuinely different arrangements');
}
console.log(JSON.stringify({passed:true,trajectories,variants:18}));
