(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const record = SmallHours.record('small-hours-good-order-best', true);
  let cells = [], moves = 0, finished = false, peeking = false;
  const adjacent = index => [index - 3, index + 3, ...(index % 3 ? [index - 1] : []), ...(index % 3 < 2 ? [index + 1] : [])].filter(i => i >= 0 && i < 9);
  const solved = () => cells.every((n, i) => n === (i + 1) % 9);
  const tiles = Array.from({ length: 8 }, (_, index) => {
    const tile = document.createElement('button'); tile.className = 'tile'; tile.dataset.value = index + 1;
    tile.textContent = index + 1; tile.addEventListener('click', () => move(index + 1));
    $('puzzle-board').append(tile); return tile;
  });
  function render() {
    const empty = cells.indexOf(0);
    tiles.forEach((tile, index) => {
      const position = cells.indexOf(index + 1), canMove = adjacent(empty).includes(position);
      // Percent translations include the six-pixel gutter removed from each tile's size.
      tile.style.transform = `translate(calc(${position % 3 * 100}% + ${position % 3 * 6}px), calc(${Math.floor(position / 3) * 100}% + ${Math.floor(position / 3) * 6}px))`;
      tile.classList.toggle('neighbor', canMove && !finished); tile.classList.toggle('correct', position === index);
      tile.setAttribute('aria-label', `Tile ${index + 1}, row ${Math.floor(position / 3) + 1}, column ${position % 3 + 1}${canMove ? ', can slide' : ''}`);
      tile.setAttribute('aria-disabled', String(finished || peeking || !canMove));
    });
    $('moves').textContent = moves;
    $('placed').textContent = `${cells.filter((n, i) => n && n === i + 1).length} / 8`;
  }
  function peek(show) {
    peeking = show; $('goal').hidden = !show; $('peek').setAttribute('aria-expanded', String(show));
    $('peek').textContent = show ? 'Hide goal' : 'Show goal'; render();
  }
  function restart() {
    cells = [1,2,3,4,5,6,7,8,0]; let previous = -1;
    // A walk from the goal preserves solvability; avoid immediately undoing a step.
    for (let step = 0; step < 32 || solved(); step++) {
      const empty = cells.indexOf(0), choices = adjacent(empty).filter(n => n !== previous);
      const next = choices[Math.floor(Math.random() * choices.length)];
      [cells[empty], cells[next]] = [cells[next], cells[empty]]; previous = empty;
    }
    moves = 0; finished = false; $('result').hidden = true; peek(false);
    $('message').textContent = 'A fresh arrangement. Every puzzle has a way home.';
  }
  function move(value) {
    if (finished || peeking) return;
    const index = cells.indexOf(value), empty = cells.indexOf(0);
    if (!adjacent(empty).includes(index)) { $('message').textContent = 'Choose a tile beside the empty space.'; return; }
    [cells[empty], cells[index]] = [cells[index], cells[empty]]; moves++; render();
    $('message').textContent = `Tile ${value} moved. Empty space: row ${Math.floor(index / 3) + 1}, column ${index % 3 + 1}.`;
    if (solved()) {
      finished = true; render(); const improved = record.save(moves);
      $('result-title').textContent = 'Everything in its place.';
      $('result-copy').textContent = `Order restored in ${moves} moves. ${improved ? 'A new personal best.' : 'Enjoy that little moment of satisfaction.'}`;
      $('result').hidden = false; $('message').textContent = `Puzzle complete in ${moves} moves.`;
      $('again').focus({ preventScroll: true });
    }
  }
  document.addEventListener('keydown', event => {
    const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 };
    if (!(event.key in offsets) || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault(); if (finished || peeking) return;
    const empty = cells.indexOf(0), target = empty + offsets[event.key];
    if (adjacent(empty).includes(target)) move(cells[target]);
  });
  $('peek').addEventListener('click', () => peek(!peeking));
  $('restart').addEventListener('click', restart);
  $('again').addEventListener('click', () => { restart(); tiles[0].focus(); });
  restart();
})();
