import { start, legal, step, view, engines } from './engines.mjs';
const $=id=>document.getElementById(id);
try {
  const response=await fetch('games.json');if(!response.ok)throw Error('Could not load the game menu.');
  const games=await response.json(),id=new URLSearchParams(location.search).get('game')||'reversi',game=games.find(g=>g.id===id);
  if(!game||!engines[id])throw Error('This table is not in the collection. Return to All games and choose another.');
  document.title=game.name+' — Small Hours';document.body.dataset.gameId=id;document.documentElement.style.setProperty('--accent',game.accent);
  $('title').replaceChildren(document.createTextNode(game.name));const period=document.createElement('span');period.textContent='.';$('title').append(period);
  $('table-label').textContent=game.name+' / The strategy room';$('seal').textContent=game.symbol;$('tagline').textContent=game.description;
  game.rules.forEach((rule,i)=>{const li=document.createElement('li'),b=document.createElement('b'),p=document.createElement('p');b.textContent=['Set the table.','Consider your move.','Bring it home.'][i];p.textContent=rule;li.append(b,p);$('rules').append(li);});$('controls').textContent=game.controls;if(id==='four')$('controls').textContent+=' You can also tap any board slot in the column you want.';
  const competitive=['reversi','four','kalah','nim','fences','pawns','guild','bridge','hex','siege'].includes(id);
  $('score-note').textContent=competitive?'Record scoring: a win earns 3, a draw 2, and a completed loss 1. The house uses the same visible rules; no hidden bonuses.':({peg:'Record: 8 minus pebbles remaining. One pebble earns 7.',fleet:'Record: 26 minus soundings. Fewer soundings earns a higher record.',orchard:'Record: fruit gathered plus 1. Market goal: 20 fruit.',towers:'Record: number of squares watched. A perfect plan scores 25.',trade:'Record: coins at close, after automatic final sale. Goal: 24.'}[id]);
  const record=SmallHours.record('small-hours-strategy-'+id);let state=start(id);
  function render(focusId){const previousActions=[...document.querySelectorAll('[data-action]')],focusIndex=previousActions.findIndex(x=>x.dataset.action===focusId);const v=view(id,state),allowed=legal(id,state);$('scoreboard').replaceChildren();for(const[label,value]of v.stats){const d=document.createElement('div'),span=document.createElement('span'),strong=document.createElement('strong');span.textContent=label;strong.textContent=value;d.append(span,strong);$('scoreboard').append(d);}
    const board=$('board');board.className=v.kind||'';board.style.setProperty('--cols',v.cols);board.replaceChildren();
    function make(c,action=false){const usable=allowed.includes(c.id)&&c.legal!==false,el=document.createElement(action||c.legal!==false?'button':'div');el.textContent=c.text;el.className=(action?'':'tile ')+(c.kind||'')+(usable?' legal':'');el.setAttribute('aria-label',c.label);if(el.tagName==='BUTTON'){el.type='button';el.dataset.action=c.id;el.setAttribute('aria-disabled',String(!usable));if(action)el.disabled=!usable;el.addEventListener('click',()=>{if(!usable){$('message').textContent=state.done?'This round is complete. Choose Another round to play again.':'That move is unavailable. Choose a dotted square or an enabled action.';return;}const next=step(id,state,c.id);state=next;render(c.id);});}else el.setAttribute('role','img');for(const side of c.walls||[])el.classList.add('wall-'+side);return el;}
    v.cells.forEach(c=>board.append(make(c)));$('actions').replaceChildren();(v.buttons||[]).forEach(c=>$('actions').append(make(c,true)));
    $('caption').hidden=!v.caption;$('caption').textContent=v.caption||'';$('message').textContent=state.note;$('result').hidden=!state.done;
    if(state.done){record.save(state.score);$('result-title').textContent=state.title;$('result-copy').textContent=state.note+` Record score: ${state.score}.`;$('again').focus({preventScroll:true});}
    else if(focusId!==undefined){const actions=[...document.querySelectorAll('[data-action]')],usable=x=>!x.disabled&&x.getAttribute('aria-disabled')!=='true';const target=actions.find(x=>x.dataset.action===focusId&&usable(x))||actions.slice(Math.max(0,focusIndex)).find(usable)||actions.filter(usable).at(-1);if(target)target.focus({preventScroll:true});}
    document.body.dataset.gameReady='true';document.body.dataset.completed=String(!!state.done);
  }
  function reset(){state=start(id);render();$('message').textContent='Fresh round. '+state.note;}
  $('restart').addEventListener('click',reset);$('again').addEventListener('click',()=>{reset();document.querySelector('#board button, #actions button:not(:disabled)')?.focus({preventScroll:true});});
  // Four's numbered controls are the keyboard interface. The complete visual
  // column is also a pointer target, so narrow mobile columns are easy to use.
  if(id==='four')$('board').addEventListener('click',e=>{
    const tile=e.target.closest('.tile');if(!tile||tile.parentElement!==$('board'))return;
    const column=String([...$('board').children].indexOf(tile)%7);
    if(!legal(id,state).includes(column)){$('message').textContent=state.done?'This round is complete. Choose Another round.':'That column is full. Choose another.';return;}
    state=step(id,state,column);render(column);
  });
  $('board').addEventListener('keydown',e=>{const dir={ArrowLeft:-1,ArrowRight:1,ArrowUp:-view(id,state).cols,ArrowDown:view(id,state).cols}[e.key];if(!dir)return;const children=[...$('board').children],i=children.indexOf(document.activeElement);if(i<0)return;e.preventDefault();let next=i+dir;while(next>=0&&next<children.length){if(children[next].tagName==='BUTTON'&&!children[next].classList.contains('void')){children[next].focus();break;}next+=dir;}});
  render();
} catch(error){$('message').textContent=error.message;document.body.dataset.gameReady='error';$('restart').disabled=true;}
