(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const record = SmallHours.record('small-hours-double-take-best', true);
  const names = ['Circle', 'Triangle', 'Diamond', 'Cross', 'Moon', 'Waves', 'Square', 'Star'];
  const shapes = [
    '<circle cx="30" cy="30" r="19"/>', '<path d="M30 9 52 48H8Z"/>',
    '<path d="m30 7 23 23-23 23L7 30Z"/>', '<path d="M30 10v40M10 30h40"/>',
    '<path d="M40 10A22 22 0 1 0 50 43 24 24 0 0 1 40 10Z"/>',
    '<path d="M8 21q11-16 22 0t22 0M8 39q11-16 22 0t22 0"/>',
    '<rect x="12" y="12" width="36" height="36" rx="5"/>',
    '<path d="m30 6 6 17 18 1-14 11 5 18-15-10-15 10 5-18L6 24l18-1Z"/>'
  ];
  let deck = [], first = null, second = null, matched = new Set(), turns = 0, locked = false, timer = null, generation = 0;
  const cards = Array.from({ length: 16 }, (_, index) => {
    const card = document.createElement('button');
    card.className = 'card'; card.type = 'button';
    card.addEventListener('click', () => flip(index));
    card.addEventListener('keydown', event => {
      const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 };
      if (event.key in steps) { event.preventDefault(); cards[(index + steps[event.key] + 16) % 16].focus(); }
    });
    $('memory-board').append(card); return card;
  });
  function render() {
    cards.forEach((card, i) => {
      const paired = matched.has(i), open = paired || i === first || i === second;
      card.className = `card${paired ? ' matched' : open ? ' open' : ''}`;
      card.setAttribute('aria-disabled', String(paired || locked || i === first));
      card.setAttribute('aria-label', `Card ${i + 1}: ${open ? names[deck[i]] : 'face down'}${paired ? ', matched' : ''}`);
      card.innerHTML = open ? `<svg viewBox="0 0 60 60" aria-hidden="true">${shapes[deck[i]]}</svg>` : `<span class="card-back" aria-hidden="true">${String(i + 1).padStart(2,'0')}</span>`;
    });
    $('turns').textContent = turns;
    $('pairs').textContent = `${matched.size / 2} / 8`;
    $('precision').textContent = turns ? `${Math.round(matched.size / 2 / turns * 100)}%` : '—';
  }
  function restart() {
    clearTimeout(timer); timer = null; generation++;
    deck = SmallHours.shuffle([...Array(8).keys(), ...Array(8).keys()]);
    first = second = null; matched = new Set(); turns = 0; locked = false;
    $('result').hidden = true; $('message').textContent = 'A fresh set. Turn two cards and find a pair.'; render();
  }
  function flip(index) {
    if (locked || matched.has(index) || index === first || matched.size === 16) return;
    if (first === null) { first = index; $('message').textContent = `${names[deck[index]]}. Find its other half.`; render(); return; }
    second = index; turns++;
    if (deck[first] === deck[second]) {
      matched.add(first); matched.add(second); first = second = null;
      $('message').textContent = `A perfect pair. ${matched.size / 2} of 8 found.`;
      if (matched.size === 16) {
        const improved = record.save(turns);
        $('result-title').textContent = 'Two of a kind.';
        $('result-copy').textContent = `All eight pairs in ${turns} turns. ${improved ? 'A new personal best.' : 'A little attention, beautifully spent.'}`;
        $('result').hidden = false; $('again').focus({ preventScroll: true });
        $('message').textContent = `Round complete. Eight pairs in ${turns} turns.`;
      }
      render(); return;
    }
    locked = true; render(); $('message').textContent = 'Not quite a pair. Remember where they live.';
    const current = generation;
    timer = setTimeout(() => {
      if (current !== generation) return;
      first = second = null; locked = false; timer = null; render();
      $('message').textContent = 'Try another pair.';
    }, 950);
  }
  $('restart').addEventListener('click', restart);
  $('again').addEventListener('click', () => { restart(); cards[0].focus(); });
  restart();
})();
