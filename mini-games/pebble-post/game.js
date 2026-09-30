(() => {
  'use strict';
  const levels = [
    {name:'The doorstep',par:1,map:['#######','#     #','# @$. #','#     #','#######']},
    {name:'Around the corner',par:2,map:['#######','#  .  #','#  $  #','# # @ #','#     #','#######']},
    {name:'Two invitations',par:10,map:['########','# .  . #','# $  $ #','#  ##  #','#  @   #','########']},
    {name:'The back lane',par:14,map:['########','# . .  #','# $ #  #','#  $   #','# # @  #','#      #','########']},
    {name:'Last collection',par:20,map:['########','# .  . #','#  #   #','# $$ . #','#  $ # #','# @    #','########']}
  ];
  const $ = id => document.getElementById(id), board = $('board');
  const record = SmallHours.record('small-hours-pebble-post-best', true);
  let level=0, player=0, boxes=new Set(), goals=new Set(), floor=new Set(), width=0, moves=0, history=[], completed=[], solved=false;
  function render() {
    board.replaceChildren();
    levels[level].map.forEach((row,y) => [...row].forEach((c,x) => {
      const p=y*width+x, cell=document.createElement('div');
      cell.className='cell'+(c==='#'?' wall':'')+(goals.has(p)?' goal':'');
      let desc=c==='#'?'Wall':goals.has(p)?'Stamp':'Path';
      if(boxes.has(p)){const parcel=document.createElement('span');parcel.className='parcel';cell.append(parcel);desc=goals.has(p)?'Delivered parcel':'Parcel';}
      if(player===p){const courier=document.createElement('span');courier.className='courier';cell.append(courier);desc='Courier'+(goals.has(p)?' on stamp':'');}
      cell.setAttribute('aria-label',`Row ${y+1}, column ${x+1}: ${desc}`);cell.setAttribute('role','img');board.append(cell);
    }));
    $('stop').textContent=`${level+1} / 5`;
    $('moves').textContent=`${moves} / ${levels[level].par}`;
    $('delivered').textContent=`${[...boxes].filter(p=>goals.has(p)).length} / ${boxes.size}`;
    $('undo').disabled=history.length===0;
    document.querySelectorAll('[data-dir]').forEach(b=>b.disabled=solved);
  }
  function load() {
    const data=levels[level];width=data.map[0].length;boxes=new Set();goals=new Set();floor=new Set();moves=0;history=[];solved=false;
    data.map.forEach((r,y)=>[...r].forEach((c,x)=>{const p=y*width+x;if(c!=='#')floor.add(p);if(c==='.')goals.add(p);if(c==='$')boxes.add(p);if(c==='@')player=p;}));
    board.style.setProperty('--cols',width);$('address').textContent=`0${level+1} / ${data.name}`;$('result').hidden=true;
    $('message').textContent=level===0?'A parcel, a stamp, and one small step. Push right to deliver.':'Find a way behind each parcel. Every stamp needs a delivery.';
    render();
  }
  function move(dir) {
    if(solved)return;
    const delta={U:-width,R:1,D:width,L:-1}[dir], next=player+delta;
    if(!floor.has(next)){ $('message').textContent='A wall in the way. Try another direction.';return; }
    if(boxes.has(next)&&(!floor.has(next+delta)||boxes.has(next+delta))){$('message').textContent='No room to push. Try another side, or undo with Z.';return;}
    history.push({player,boxes:[...boxes]});
    if(boxes.has(next)){boxes.delete(next);boxes.add(next+delta);}
    player=next;moves++;solved=[...boxes].every(p=>goals.has(p));render();
    $('message').textContent=`Courier at row ${Math.floor(player/width)+1}, column ${player%width+1}. ${[...boxes].filter(p=>goals.has(p)).length} of ${boxes.size} parcels delivered.`;
    if(solved){
      const total=completed.reduce((a,b)=>a+b,0)+moves,last=level===4;
      $('result-title').textContent=last?'All signed, sealed, delivered.':'A little joy, delivered.';
      $('result-copy').textContent=last?`Five stops. ${total} moves. Route par: 47. ${total===47?'An immaculate round.': 'Take another round and find a shorter path.'}`:`${moves} moves · par ${levels[level].par}. ${moves===levels[level].par?'Perfectly planned.':'Delivered with care. Can you find a shorter route?'}`;
      $('next').textContent=last?'Take another route ↗':'Next delivery ↗';$('result').hidden=false;$('result').classList.remove('arrival');void $('result').offsetWidth;$('result').classList.add('arrival');
      $('message').textContent=last?`Route complete in ${total} moves. All five deliveries made.`:`Stop ${level+1} complete in ${moves} moves. Next delivery is ready below.`;
      if(last)record.save(total);
      $('next').focus({preventScroll:true});
    }
  }
  function undo(){if(!history.length)return;const prev=history.pop();player=prev.player;boxes=new Set(prev.boxes);moves--;solved=false;$('result').hidden=true;render();$('message').textContent='One step back. A fresh possibility.';}
  document.querySelectorAll('[data-dir]').forEach(b=>b.addEventListener('click',()=>move(b.dataset.dir)));
  $('undo').addEventListener('click',undo);$('restart').addEventListener('click',load);
  $('restart-route').addEventListener('click',()=>{level=0;completed=[];load();});
  $('next').addEventListener('click',()=>{if(!solved)return;if(level===4){level=0;completed=[];}else{completed.push(moves);level++;}load();board.focus({preventScroll:true});});
  document.addEventListener('keydown',e=>{
    if(e.altKey||e.ctrlKey||e.metaKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
    const dir={ArrowUp:'U',ArrowRight:'R',ArrowDown:'D',ArrowLeft:'L',w:'U',d:'R',s:'D',a:'L'}[e.key.length===1?e.key.toLowerCase():e.key];
    if(dir){e.preventDefault();move(dir);}else if(e.key.toLowerCase()==='z'){e.preventDefault();undo();}
  });
  load();
})();
