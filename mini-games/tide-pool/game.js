(() => {
  'use strict';
  const colors = [
    {name:'Mint',shape:'●',hex:'#a5d3b4'}, {name:'Coral',shape:'◆',hex:'#f2aa91'},
    {name:'Sand',shape:'▲',hex:'#e7d995'}, {name:'Foam',shape:'✚',hex:'#dceee6'},
    {name:'Lilac',shape:'■',hex:'#bcb8dc'}
  ];
  const $ = id => document.getElementById(id);
  const record = SmallHours.record('small-hours-tide-pool-best');
  let stage, size, board, original, owned, current, moves, budget, score, ended, won;
  function adjacent(i) {
    const out=[]; if(i>=size) out.push(i-size); if(i<size*(size-1)) out.push(i+size);
    if(i%size) out.push(i-1); if(i%size<size-1) out.push(i+1); return out;
  }
  function absorb(region, color, cells) {
    const result=new Set(region), queue=[...region];
    for(let q=0;q<queue.length;q++) for(const j of adjacent(queue[q]))
      if(!result.has(j)&&cells[j]===color){result.add(j);queue.push(j);}
    return result;
  }
  // A constructive greedy route certifies the budget. Each step adds at least one tile.
  function solutionLength(cells) {
    let region=absorb(new Set([0]),cells[0],cells), count=0;
    while(region.size<cells.length){let best=region;for(let c=0;c<5;c++){const candidate=absorb(region,c,cells);if(candidate.size>best.size) best=candidate;}region=best;count++;}
    return count;
  }
  function load(fresh=true) {
    size=stage+5;
    if(fresh){original=Array.from({length:size*size},()=>Math.floor(Math.random()*5));if(original.every(c=>c===original[0]))original[original.length-1]=(original[0]+1)%5;budget=solutionLength(original)+3;}
    board=[...original];current=board[0];owned=absorb(new Set([0]),current,board);moves=budget;ended=false;won=false;
    $('result').hidden=true; $('pool-name').textContent=['The shallows','Coral garden','Open water'][stage-1];
    $('message').textContent='Choose a shape. Gather neighboring glass of the same color.';
    render();
  }
  function render(fresh=new Set()) {
    $('stage').textContent=`${stage} / 3`; $('moves').textContent=moves;
    $('gathered').textContent=`${owned.size} / ${board.length}`;
    $('board').style.setProperty('--size',size); $('board').replaceChildren();
    const descriptions=[];
    board.forEach((c,i)=>{const tile=document.createElement('span');tile.className='glass'+(owned.has(i)?' owned':'')+(fresh.has(i)?' fresh':'');tile.style.background=colors[c].hex;tile.textContent=colors[c].shape;tile.dataset.color=c;tile.dataset.owned=String(owned.has(i));tile.setAttribute('aria-hidden','true');$('board').append(tile);descriptions.push(`${i+1}: ${colors[c].name}${owned.has(i)?' gathered':''}`);});
    $('board').setAttribute('aria-label',`${size} by ${size} sea glass board, read left to right. ${descriptions.join('; ')}`);
    $('progress').style.width=`${owned.size/board.length*100}%`;
    [...$('palette').children].forEach((button,c)=>{button.disabled=ended||c===current;button.setAttribute('aria-label',`${c+1}: ${colors[c].name} ${['circle','diamond','triangle','cross','square'][c]}${c===current?', current tide':''}`);});
  }
  function choose(c) {
    if(ended||c===current)return;
    const previous=owned;owned=absorb(owned,c,board);current=c;moves--;
    for(const i of owned)board[i]=c;
    const added=new Set([...owned].filter(i=>!previous.has(i)));
    $('message').textContent=added.size?`${colors[c].name} tide · ${added.size} new pieces of glass. ${moves} moves remain.`:`A quiet tide. No new glass this move. ${moves} moves remain.`;
    won=owned.size===board.length;
    if(won||moves===0){ended=true;$('result').hidden=false;
      if(won){score+=500+moves*100;$('result-title').textContent=stage===3?'A whole little ocean.':'The pool is yours.';$('result-copy').textContent=`${moves} moves to spare. Expedition score: ${score.toLocaleString()}.${stage===3?' All three pools cleared. Take another dip?':''}`;if(stage===3)record.save(score);$('next').textContent=stage===3?'New expedition ↗':'Next pool ↗';}
      else{$('result-title').textContent='The tide ran out.';$('result-copy').textContent=`You gathered ${owned.size} of ${board.length} pieces. Try the same pool again: look for colors that open up a bigger shore.`;$('next').textContent='Retry this pool ↗';}
      $('message').textContent=won?'Pool complete. Continue below.':'No moves left. Retry below.';
    }
    render(added);
    if(ended)$('next').focus({preventScroll:true});
  }
  colors.forEach((color,c)=>{const button=document.createElement('button');button.style.background=color.hex;button.innerHTML=`<b aria-hidden="true">${color.shape}</b><small>${c+1} ${color.name}</small>`;button.addEventListener('click',()=>choose(c));$('palette').append(button);});
  function restart(){stage=1;score=0;load();}
  $('restart').addEventListener('click',restart);
  $('next').addEventListener('click',()=>{if(won){if(stage===3)restart();else{stage++;load();}}else load(false); [...$('palette').children].find(b=>!b.disabled).focus({preventScroll:true});});
  document.addEventListener('keydown',e=>{if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(/^[1-5]$/.test(e.key)){e.preventDefault();choose(Number(e.key)-1);}});
  restart();
})();
