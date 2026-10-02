/* Shared presentation and lifecycle. Game rules remain in independent engines. */
export function mountRoom({games, engines, title}) {
  const $=id=>document.getElementById(id), board=$('board');
  const requested=new URLSearchParams(location.search).get('game');
  const game=games.find(g=>g.id===(requested||games[0]?.id));
  if(!game||!engines[game.id]) {
    document.title='Game unavailable — Small Hours'; $('title').textContent='This game is unavailable.';
    $('description').textContent='Choose a game from the catalog to begin.';
    $('intro').hidden=true; $('status').textContent='The requested game link does not identify a playable game.';
    $('tools').hidden=true; $('mode-choice').hidden=true;
    document.body.dataset.gameReady='true'; document.body.dataset.outcome='unavailable'; return;
  }
  const engine=engines[game.id], stages=engine.stages||game.stages||3;
  const matchSeries=game.endless?.kind==='match-series';
  const optionalName=matchSeries?'Match series':'Endless';
  let stage=0, state=null, history=[], total=0, mode='finite', active=false, paused=false;
  let paint=[], live=[], controls=[], rangeControls=[], last=0, frame=0, endedByPlayer=false;
  const seedParam=new URLSearchParams(location.search).get('seed');
  const replaySeed=seedParam!==null&&/^\d{1,10}$/.test(seedParam)&&Number(seedParam)<=0xffffffff?Number(seedParam)>>>0:null;
  let runSeed=replaySeed??newSeed(), storedBest={finite:0,endless:0}, storageFailure=false;
  const key='small-hours-400-'+game.id+'-best';
  try { const saved=JSON.parse(localStorage.getItem(key)||'{}'); for(const m of ['finite','endless'])if(Number.isFinite(saved[m])&&saved[m]>=0)storedBest[m]=saved[m]; }
  catch { storageFailure=true; }
  function newSeed(){const a=new Uint32Array(1);try{crypto.getRandomValues(a);return a[0]}catch{return (Date.now()^Math.floor(performance.now()*1000))>>>0}}
  const stageSeed=()=>((runSeed+Math.imul(stage+1,0x9e3779b9))>>>0);
  document.title=game.name+' — Small Hours'; $('title').textContent=game.name;
  $('room-title').textContent=title; $('description').textContent=game.description;
  document.body.dataset.gameId=game.id;
  document.documentElement.style.setProperty('--accent',game.accent||'#d5dfca');
  for(const rule of game.rules){const li=document.createElement('li');li.textContent=rule;$('rules').append(li)}
  $('controls-guide').textContent=game.controls;
  $('endless-note').textContent=game.endless?.supported?game.endless.design:(game.endless?.reason||'This game uses a finite campaign.');
  $('endless-option').disabled=!game.endless?.supported;
  if(matchSeries)$('endless-option').textContent='Match series';
  if(!game.endless?.supported)$('endless-option').textContent='Endless unavailable';
  $('mode').onchange=()=>{mode=$('mode').value;active=false;state=null;history=[];stage=0;total=0;paused=false;endedByPlayer=false;cancelAnimationFrame(frame);render();$('start').focus()};
  function score(){return total+Math.max(0,Number.isFinite(state?.score)?state.score:0)}
  function saveBest(){if(score()<=storedBest[mode])return;storedBest[mode]=score();try{localStorage.setItem(key,JSON.stringify(storedBest))}catch{storageFailure=true}}
  function summary(){
    document.body.dataset.mode=mode;document.body.dataset.stage=String(stage);
    document.body.dataset.outcome=!active?'intro':endedByPlayer?'win':state?.outcome==='win'&&(mode==='endless'||stage<stages-1)?'study-win':state?.outcome||'playing';
    $('scoreboard').textContent=mode==='endless'?`${optionalName} · ${matchSeries?'match':'challenge'} ${stage+1}`:`Challenge ${stage+1} / ${stages}`;
    if($('seed-note'))$('seed-note').textContent=`Run seed ${runSeed}. Add ?game=${game.id}&seed=${runSeed} to this room’s address to replay its challenges.`;
    $('score').textContent=String(Math.round(score()));$('best').textContent=String(Math.round(storedBest[mode]));
    $('storage-note').textContent=storageFailure?'Records are kept in memory for this visit because browser storage is unavailable.':'Personal records stay in this browser. Finite and endless records are separate.';
    $('status').textContent=paused?'Paused. Resume when you are ready.':state?.note||'Read the field guide, choose your mode, and begin.';
    $('pause').hidden=!engine.realtime||!active||state?.outcome!=='playing';$('pause').textContent=paused?'Resume':'Pause';
    $('undo').disabled=!history.length||engine.undo===false||engine.realtime||mode==='endless'||endedByPlayer;
    $('reset').disabled=!active||mode==='endless';
    $('end-run').hidden=mode!=='endless'||!active||endedByPlayer||state?.outcome!=='playing';
  }
  function el(tag,text,parent=board){const e=document.createElement(tag);if(text!==undefined)e.textContent=String(text);parent.append(e);return e}
  function render(focus){
    paint=[];live=[];controls=[];rangeControls=[];board.replaceChildren();
    $('intro').hidden=active;board.hidden=!active;$('result').hidden=true;$('pause-banner').hidden=!paused;
    summary();if(!state)return;
    let group=board;
    const c={
      p:text=>el('p',text),h:text=>el('h3',text),pre:text=>{const e=el('pre',text);e.className='readout';return e},
      group:label=>{group=el('div','');group.className='buttons';if(label){group.setAttribute('role','group');group.setAttribute('aria-label',label)}return group},
      grid:(cols,label,options={})=>{group=el('div','');group.className='game-grid'+(options.compact?' compact-grid':'');group.style.setProperty('--cols',cols);group.setAttribute('role','group');group.setAttribute('aria-label',label||'Game board');return group},
      table:(heads,rows)=>{const w=el('div','');w.className='table-wrap';const t=el('table','',w),tr=el('tr','',el('thead','',t));heads.forEach(h=>{let th=el('th',h,tr);th.scope='col'});const b=el('tbody','',t);rows.forEach(row=>{const r=el('tr','',b);row.forEach(v=>el('td',v,r))});return t},
      button:(action,label,disabled=false,selected=undefined)=>{if(group===board)c.group();const b=el('button',label,group);b.dataset.action=action;
        const disabledFn=typeof disabled==='function'?disabled:()=>disabled;b.disabled=disabledFn(state)||state.outcome!=='playing'||paused||endedByPlayer;
        if(selected!==undefined)b.setAttribute('aria-pressed',String(selected));b.onclick=()=>act(action);controls.push({el:b,disabledFn});return b},
      range:(action,label,opts)=>{const w=el('label','');w.className='range-control';const text=el('span',label,w),input=el('input',undefined,w);input.type='range';input.dataset.action=action;
        for(const k of ['min','max','step','value'])if(opts[k]!==undefined)input[k]=opts[k];const output=el('output',input.value,w);input.setAttribute('aria-label',label);input.oninput=()=>{output.textContent=input.value;act(action+':'+input.value,false,action,true)};input.onchange=()=>render(action);rangeControls.push(input);input.disabled=state.outcome!=='playing'||paused||endedByPlayer;return input},
      live:(label,value)=>{const e=el('p','');e.className='live-readout';live.push({el:e,value:()=>label+': '+value(state)});return e},
      canvas:(key,width,height,draw,pointer)=>{const canvas=el('canvas',undefined);canvas.width=width;canvas.height=height;canvas.dataset.canvas=key;canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',game.name+' play field. Use the labeled controls below.');const ctx=canvas.getContext('2d');paint.push(()=>draw(ctx,state));
        if(pointer){const send=e=>{if(!active||paused||state.outcome!=='playing')return;const r=canvas.getBoundingClientRect();const phase=e.type==='pointerdown'?'down':e.type==='pointermove'?'move':'up';if(phase==='move'&&!e.buttons)return;const action=pointer(Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height)),phase);if(action!==undefined)act(action);};canvas.style.touchAction='none';canvas.onpointerdown=e=>{canvas.focus();canvas.setPointerCapture(e.pointerId);send(e)};canvas.onpointermove=send;canvas.onpointerup=send;canvas.onpointercancel=()=>engine.pause?.(state)}return canvas},
      hold:(action,label)=>{if(group===board)c.group();const b=el('button',label,group);b.dataset.action=action;let held=false;const down=()=>{if(held||b.disabled)return;held=true;act('down:'+action,true)},up=()=>{if(!held)return;held=false;act('up:'+action,true)};
        b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);down()};b.onpointerup=up;b.onpointercancel=up;b.onlostpointercapture=up;b.onkeydown=e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();down()}};b.onkeyup=e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();up()}};b.onblur=up;controls.push({el:b,disabledFn:()=>false});return b}
    };
    engine.render(c,state);updateLive();
    if(state.outcome!=='playing'||endedByPlayer){
      saveBest();summary();$('result').hidden=false;
      const won=state.outcome==='win';$('result-title').textContent=endedByPlayer?'Run banked.':won?(mode==='endless'?(matchSeries?'Match complete.':'Challenge complete.'):stage<stages-1?'Challenge complete.':'Campaign complete.'):'Try a new approach.';
      $('result-copy').textContent=state.note;$('next').hidden=!won||endedByPlayer||(mode==='finite'&&stage>=stages-1);
      $('next').textContent=mode==='endless'?(matchSeries?'Next match →':'Next generated challenge →'):'Next challenge →';$('again').textContent='Play again';$('result').focus();
    }else if(focus){const b=board.querySelector(`[data-action="${CSS.escape(focus)}"]`);if(b&&!b.disabled)b.focus();else board.querySelector('button:not(:disabled),input:not(:disabled),canvas')?.focus()}
  }
  function updateLive(){for(const p of paint)p();for(const item of live)item.el.textContent=item.value();for(const b of controls)b.el.disabled=state.outcome!=='playing'||paused||endedByPlayer||b.disabledFn(state);for(const r of rangeControls)r.disabled=state.outcome!=='playing'||paused||endedByPlayer;summary()}
  function act(action,hold=false,focusKey=action,keepDOM=false){
    if(!active||paused||!state||state.outcome!=='playing'||endedByPlayer)return;
    const before=!engine.realtime&&engine.undo!==false&&mode==='finite'?structuredClone(state):null;
    const previous=state.outcome,renderRequested=engine.act(state,action);
    if(before&&JSON.stringify(before)!==JSON.stringify(state))history.push(before);
    if(state.outcome!==previous||renderRequested===true||!engine.realtime&&!keepDOM){render(hold?undefined:focusKey)}else updateLive();
  }
  function schedule(){cancelAnimationFrame(frame);last=0;if(engine.realtime)frame=requestAnimationFrame(tick)}
  function tick(time){
    if(!active||paused||!state||state.outcome!=='playing'||endedByPlayer)return;
    const dt=last?Math.min(.05,(time-last)/1000):0;last=time;
    engine.tick?.(state,dt);if(state.outcome==='playing'){updateLive();frame=requestAnimationFrame(tick)}else render();
  }
  function begin(){cancelAnimationFrame(frame);mode=$('mode').value;runSeed=replaySeed??newSeed();stage=0;total=0;history=[];paused=false;endedByPlayer=false;active=true;state=engine.init({stage,seed:stageSeed(),mode});render();board.querySelector('button:not(:disabled),input:not(:disabled),canvas')?.focus();schedule()}
  function pause(){if(!engine.realtime||!active||state?.outcome!=='playing')return;paused=!paused;engine.pause?.(state);cancelAnimationFrame(frame);last=0;$('pause-banner').hidden=!paused;updateLive();if(!paused)schedule();$('pause').focus()}
  $('start').onclick=begin;$('restart').onclick=begin;$('again').onclick=begin;$('pause').onclick=pause;
  $('next').onclick=()=>{if(!active||state.outcome!=='win'||endedByPlayer||mode==='finite'&&stage>=stages-1)return;total+=Math.max(0,state.score||0);stage++;history=[];state=engine.init({stage,seed:stageSeed(),mode});render();board.querySelector('button:not(:disabled),input:not(:disabled),canvas')?.focus();schedule()};
  $('reset').onclick=()=>{if(!active||mode==='endless')return;cancelAnimationFrame(frame);paused=false;endedByPlayer=false;history=[];state=engine.init({stage,seed:stageSeed(),mode});render();board.querySelector('button:not(:disabled),input:not(:disabled),canvas')?.focus();schedule()};
  $('undo').onclick=()=>{if(!history.length||engine.undo===false||engine.realtime||mode==='endless'||endedByPlayer)return;state=history.pop();render();board.querySelector('button:not(:disabled),input:not(:disabled),canvas')?.focus()};
  $('end-run').onclick=()=>{if(mode!=='endless'||!active||state.outcome!=='playing')return;cancelAnimationFrame(frame);engine.pause?.(state);endedByPlayer=true;state.note=`You banked ${Math.round(score())} points across ${stage} completed challenges. Play again for a fresh run.`;render()};
  window.addEventListener('blur',()=>{if(engine.realtime&&active&&!paused&&state?.outcome==='playing')pause()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&engine.realtime&&active&&!paused&&state?.outcome==='playing')pause()});
  document.addEventListener('keydown',event=>{if(event.code==='Escape'&&engine.realtime&&active&&state?.outcome==='playing'){event.preventDefault();pause()}});
  render();document.body.dataset.gameReady='true';
}
