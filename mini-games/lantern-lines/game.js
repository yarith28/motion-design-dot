(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const record = SmallHours.record('small-hours-lantern-lines-best', true);
  const names = ['The courtyard', 'The evening market', 'The sleeping neighborhood'];
  let chapter = 0, size = 3, cells = [], solution = new Set(), initial = [], initialSolution = [], history = [], total = 0, base = 0, complete = false, focus = 0, hinted = -1;
  const neighbors = i => [i, ...(i >= size ? [i-size] : []), ...(i < size*(size-1) ? [i+size] : []), ...(i%size ? [i-1] : []), ...(i%size<size-1 ? [i+1] : [])];
  function flip(i) { neighbors(i).forEach(n => { cells[n] = !cells[n]; }); if(solution.has(i)) solution.delete(i); else solution.add(i); }
  function render() {
    [...$('board').children].forEach((button, i) => { button.setAttribute('aria-pressed', String(cells[i])); button.setAttribute('aria-label', `Row ${Math.floor(i/size)+1}, column ${i%size+1}, ${cells[i] ? 'glowing' : 'off'}`); button.tabIndex = i === focus ? 0 : -1; button.disabled = complete; button.classList.toggle('hinted', hinted === i); });
    $('chapter').textContent = `${chapter+1} / 3`; $('moves').textContent = total; $('lit').textContent = cells.filter(Boolean).length;
    $('undo').disabled = !history.length || complete; $('hint').disabled = complete; $('retry').disabled = complete;
  }
  function startChapter() {
    size = chapter + 3; cells = Array(size*size).fill(false); solution = new Set();
    // XOR of legal crosses is solvable by replaying those same crosses in any order.
    // Resample the rare all-dark result so each chapter has something to solve.
    do { cells.fill(false); solution.clear(); SmallHours.shuffle(Array.from({length:size*size},(_,i)=>i)).slice(0,[4,7,10][chapter]).forEach(flip); } while(!cells.some(Boolean));
    initial = [...cells]; initialSolution = [...solution]; base = total; history = []; complete = false; focus = 0; hinted = -1;
    $('result').hidden = true; $('chapter-name').textContent = names[chapter]; $('hint-note').textContent = 'Hints are here if you need a little light.';
    $('board').style.setProperty('--size', size); $('board').replaceChildren();
    cells.forEach((_,i) => { const button = document.createElement('button'); button.className = 'lantern'; button.addEventListener('click', () => toggle(i)); button.addEventListener('focus', () => { focus = i; render(); }); $('board').append(button); });
    $('message').textContent = `${names[chapter]}. Put all ${size*size} lanterns to sleep.`; render();
  }
  function toggle(i) {
    if(complete) return;
    focus=i; flip(i); history.push(i); total++; hinted=-1; $('hint-note').textContent='One touch. A small ripple.';
    complete = !cells.some(Boolean); render();
    if(complete) {
      const last = chapter === 2; const improved = last && record.save(total);
      $('result-title').textContent = last ? 'The city is dreaming.' : 'A little more quiet.';
      $('result-copy').textContent = last ? `Three chapters, ${total} moves. ${improved ? 'Your best journey yet.' : 'Every light has found its rest.'}` : `${names[chapter]} is asleep in ${total-base} moves. A larger neighborhood awaits.`;
      $('next').textContent = last ? 'Start a new journey' : 'Next chapter'; $('result').hidden=false;
      $('message').textContent = last ? `Journey complete in ${total} moves.` : `Chapter ${chapter+1} complete.`; $('next').focus({preventScroll:true});
    } else $('message').textContent = `${cells.filter(Boolean).length} lanterns still glowing. Move ${total}.`;
  }
  function restart() { chapter=0; total=0; startChapter(); }
  $('restart').addEventListener('click', restart);
  $('next').addEventListener('click', () => { if(chapter === 2) restart(); else { chapter++; startChapter(); } $('board').children[0].focus({preventScroll:true}); });
  $('undo').addEventListener('click', () => { if(!history.length || complete) return; flip(history.pop()); total--; hinted=-1; $('hint-note').textContent='Your last ripple, reversed.'; $('message').textContent='Last move undone.'; render(); });
  $('retry').addEventListener('click', () => { if(complete) return; cells=[...initial]; solution=new Set(initialSolution); history=[]; total=base; hinted=-1; $('hint-note').textContent='Same lanterns. A fresh approach.'; $('message').textContent='Chapter reset. Earlier chapters are kept.'; render(); });
  $('hint').addEventListener('click', () => { if(complete) return; hinted=[...solution][0]; render(); $('hint-note').textContent=`Try row ${Math.floor(hinted/size)+1}, column ${hinted%size+1}. The dashed ring shows the way.`; $('message').textContent=$('hint-note').textContent; });
  $('board').addEventListener('keydown', event => {
    if(complete || event.altKey || event.ctrlKey || event.metaKey) return;
    let next=focus;
    if(event.key==='ArrowLeft') next=focus%size ? focus-1 : focus;
    else if(event.key==='ArrowRight') next=focus%size<size-1 ? focus+1 : focus;
    else if(event.key==='ArrowUp') next=Math.max(0,focus-size);
    else if(event.key==='ArrowDown') next=Math.min(size*size-1,focus+size);
    else if(event.key==='Home') next=0;
    else if(event.key==='End') next=size*size-1;
    else return;
    event.preventDefault(); focus=next; render(); $('board').children[next].focus();
  });
  restart();
})();
