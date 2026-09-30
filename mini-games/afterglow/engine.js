/* Deterministic fixed-step ricochet physics, shared by the browser and optional tests. */
(function(root, factory) {
  const engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  else root.Afterglow = engine;
})(typeof window === 'object' ? window : globalThis, () => {
  'use strict';
  const W = 560, FLOOR = 605, R = 6, SPEED = 490, STEP = 1/120;
  const patterns = [
    ['.1.+.1.', '11.*.11', '.2.2.2.'],
    ['.2.2.2.', '2.*2*.2', '.2+.+2.', '1.2.2.1'],
    ['2.3.3.2', '.3.*.3.', '2+2.2+2', '.2*3*2.']
  ];
  function create(garden, orbs = 5, power = 1, variant = 0) {
    const blocks = []; let id = 0;
    patterns[garden].forEach((row, y) => [...row].forEach((type, x) => {
      if (type === '.') return;
      const shifted = (x + variant * (y + 1)) % 7;
      const col = variant % 2 ? 6-shifted : shifted;
      blocks.push({id:id++, x:39+col*70, y:100+y*65, w:62, h:53,
        hp:type==='*'||type==='+'?1:Number(type), kind:type==='*'?'bloom':type==='+'?'seed':'pod', flash:0});
    }));
    return {blocks, balls:[], orbs, power, origin:280, angle:-Math.PI/2, pending:0, launchClock:0,
      elapsed:0, done:false, firstLanding:null, score:0, hits:0, grown:0, events:[], volley:0};
  }
  function launch(s, angle) {
    s.angle = Math.max(-Math.PI+.18, Math.min(-.18, angle));
    s.balls = []; s.pending = s.orbs; s.launchClock = 0; s.elapsed = 0;
    s.done = false; s.firstLanding = null; s.hits = 0; s.events = []; s.volley++;
  }
  function damage(s, block, amount) {
    if (block.hp <= 0) return;
    block.hp -= amount; block.flash = .13; s.hits++;
    s.score += 10; s.events.push({kind:'hit', x:block.x+31, y:block.y+26});
    if (block.hp > 0) return;
    s.score += 75; s.grown++;
    s.events.push({kind:block.kind, x:block.x+31, y:block.y+26});
    if (block.kind === 'seed') { s.orbs++; s.events.push({kind:'extra', x:block.x+31, y:block.y+26}); }
    if (block.kind === 'bloom') {
      // Mark destroyed before recursion so neighboring blooms cannot form cycles.
      s.blocks.filter(b => b.hp>0 && Math.abs(b.x-block.x)<=71 && Math.abs(b.y-block.y)<=66)
        .forEach(b => damage(s,b,2));
    }
  }
  function advance(s, dt) {
    s.events = []; if (s.done) return;
    s.elapsed += dt; s.launchClock -= dt;
    if (s.pending > 0 && s.launchClock <= 0) {
      s.balls.push({x:s.origin,y:FLOOR-1,vx:Math.cos(s.angle)*SPEED,vy:Math.sin(s.angle)*SPEED,trail:[],cooldown:0,last:-1});
      s.pending--; s.launchClock += .1;
    }
    for (const b of s.balls) {
      if (b.dead) continue;
      b.cooldown -= dt; b.x += b.vx*dt; b.y += b.vy*dt;
      if (b.x<R) {b.x=R;b.vx=Math.abs(b.vx)}
      if (b.x>W-R) {b.x=W-R;b.vx=-Math.abs(b.vx)}
      if (b.y<58+R) {b.y=58+R;b.vy=Math.abs(b.vy)}
      for (const block of s.blocks) {
        if (block.hp<=0 || (block.id===b.last && b.cooldown>0)) continue;
        const qx=Math.max(block.x,Math.min(b.x,block.x+block.w));
        const qy=Math.max(block.y,Math.min(b.y,block.y+block.h));
        let nx=b.x-qx, ny=b.y-qy, distance=Math.hypot(nx,ny);
        if (distance >= R) continue;
        if (distance > .001) {nx/=distance;ny/=distance;b.x+=nx*(R-distance+.1);b.y+=ny*(R-distance+.1)}
        else {
          const sides=[{d:b.x-block.x,nx:-1,ny:0},{d:block.x+block.w-b.x,nx:1,ny:0},{d:b.y-block.y,nx:0,ny:-1},{d:block.y+block.h-b.y,nx:0,ny:1}].sort((a,b)=>a.d-b.d);
          nx=sides[0].nx;ny=sides[0].ny;b.x+=nx*(sides[0].d+R+.1);b.y+=ny*(sides[0].d+R+.1);
        }
        const dot=b.vx*nx+b.vy*ny;
        if(dot<0){b.vx-=2*dot*nx;b.vy-=2*dot*ny;damage(s,block,s.power);b.last=block.id;b.cooldown=.055}
        break;
      }
      if(b.y>=FLOOR && b.vy>0){b.dead=true;if(s.firstLanding===null)s.firstLanding=Math.max(12,Math.min(W-12,b.x))}
    }
    s.blocks=s.blocks.filter(b=>b.hp>0);s.balls=s.balls.filter(b=>!b.dead);
    s.blocks.forEach(b=>b.flash=Math.max(0,b.flash-dt));
    if((s.pending===0 && s.balls.length===0)||s.elapsed>=12||s.blocks.length===0) recall(s);
  }
  function recall(s) {
    s.balls=[];s.pending=0;s.done=true;
    s.origin=s.firstLanding===null?s.origin:s.firstLanding;
  }
  return {W,FLOOR,R,SPEED,STEP,create,launch,advance,recall};
});
