(() => {
  'use strict';
  const bank = [
    ['CANDLE','A little flame with a waxy home.'],['POCKET','A tiny room sewn into your clothes.'],
    ['LETTER','A message that travels in an envelope.'],['GARDEN','A patch of earth you help to bloom.'],
    ['PILLOW','A soft landing for a sleepy head.'],['KETTLE','It sings when the water is ready.'],
    ['BASKET','A woven home for a picnic.'],['WINDOW','A pane that frames the world outside.'],
    ['BUTTON','A little disc that keeps a shirt together.'],['RIBBON','A soft strip tied around a gift.'],
    ['SPOON','The little scoop beside your soup.'],['CLOUD','A wandering shape made of water in the sky.'],
    ['MOON','Our nearest companion in the night sky.'],['LEAF','A tree’s little green sunlight catcher.'],
    ['BLANKET','A warm layer to curl up beneath.'],['LANTERN','A portable light inside a protective case.'],
    ['FEATHER','A bird’s light, soft covering.'],['BELL','A hollow metal object with a ringing voice.'],
    ['PAPER','The thin sheet waiting for your pencil.'],['MIRROR','A surface that looks right back at you.']
  ];
  const $ = id => document.getElementById(id);
  const record = SmallHours.record('small-hours-word-weave-best');
  let rounds, round, score, value, tiles, chosen, solved, finished;
  const say = text => { $('message').textContent = text; };
  function render() {
    $('round').textContent = `${round + 1} / 5`; $('score').textContent = score; $('value').textContent = value;
    $('answer').replaceChildren(); $('letters').replaceChildren();
    tiles.forEach((letter, index) => {
      const button = document.createElement('button'); button.className = 'tile'; button.textContent = letter;
      button.setAttribute('aria-label', `Letter ${letter}, tile ${index + 1}`);
      button.disabled = solved || chosen.includes(index); button.classList.toggle('used', chosen.includes(index));
      button.addEventListener('click', () => select(index)); $('letters').append(button);
    });
    tiles.forEach((_, slot) => {
      const index = chosen[slot], filled = index !== undefined;
      const el = document.createElement(filled ? 'button' : 'span'); el.className = filled ? 'tile answer-tile' : 'slot';
      el.textContent = filled ? tiles[index] : '·';
      if (filled) { el.disabled = solved; el.setAttribute('aria-label', `Remove ${tiles[index]} at position ${slot + 1}`); el.addEventListener('click', () => remove(slot)); }
      else el.setAttribute('aria-hidden','true');
      $('answer').append(el);
    });
    $('answer').setAttribute('aria-label', `Your word: ${chosen.map(i => tiles[i]).join('') || 'empty'}`);
    $('answer').classList.toggle('solved', solved);
    $('check').disabled = solved || chosen.length !== tiles.length;
    $('check').hidden = solved; $('next').hidden = !solved || finished;
    $('next').textContent = round === 4 ? 'See your score ↗' : 'Next clue ↗';
    $('hint').disabled = solved; $('clear').disabled = solved || !chosen.length;
  }
  function select(index) {
    if (solved || chosen.includes(index)) return;
    chosen.push(index); render();
    (chosen.length === tiles.length ? $('check') : $('letters').querySelector('button:not(:disabled)')).focus();
  }
  function remove(slot) {
    if (solved) return;
    chosen.splice(slot, 1); render();
    ($('answer').children[Math.min(slot, chosen.length - 1)] || $('letters').querySelector('button:not(:disabled)')).focus();
  }
  function load() {
    value = 100; chosen = []; solved = false;
    tiles = SmallHours.shuffle([...rounds[round][0]]);
    if (tiles.join('') === rounds[round][0]) tiles.push(tiles.shift());
    $('clue').textContent = rounds[round][1]; $('length').textContent = `${tiles.length} LETTERS / ONE LITTLE THOUGHT`;
    say('Follow the clue. Give these letters a little order.'); render();
  }
  function restart() { rounds = SmallHours.shuffle([...bank]).slice(0, 5); round = 0; score = 0; finished = false; $('result').hidden = true; load(); }
  function check() {
    if (solved || chosen.length !== tiles.length) return;
    if (chosen.map(i => tiles[i]).join('') === rounds[round][0]) {
      score += value; solved = true; say(`Lovely. ${rounds[round][0]} earns ${value} points.`); render(); $('next').focus();
    } else { value = Math.max(20, value - 10); say('Not quite the word in the clue. Rearrange a letter, or ask for a hint. −10 points, with a 20-point minimum.'); render(); }
  }
  function next() {
    if (!solved || finished) return;
    if (round === 4) { finished = true; record.save(score); $('result-copy').textContent = `Five threads, beautifully tied. You earned ${score} / 500 points. A fresh set of clues is waiting whenever you are.`; $('result').hidden = false; render(); $('again').focus(); }
    else { round++; load(); $('hint').focus(); }
  }
  $('hint').addEventListener('click', () => {
    if (solved) return;
    const answer = rounds[round][0]; let prefix = 0;
    while (prefix < chosen.length && tiles[chosen[prefix]] === answer[prefix]) prefix++;
    if (prefix === answer.length) { say('Your word is ready. Check it!'); return; }
    chosen = chosen.slice(0, prefix); chosen.push(tiles.findIndex((letter, index) => letter === answer[prefix] && !chosen.includes(index)));
    value = Math.max(20, value - 20); say(`A thread to follow: letter ${prefix + 1} is ${answer[prefix]}. −20 points, with a 20-point minimum.`); render();
  });
  $('clear').addEventListener('click', () => { if (!solved) { chosen = []; render(); $('letters').querySelector('button:not(:disabled)').focus(); } });
  $('check').addEventListener('click',check); $('next').addEventListener('click',next);
  $('restart').addEventListener('click',restart); $('again').addEventListener('click',restart);
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    if (/^[a-z]$/i.test(event.key) && !solved) {
      const index = tiles.findIndex((letter, i) => letter === event.key.toUpperCase() && !chosen.includes(i));
      if (index >= 0) { event.preventDefault(); select(index); }
    } else if (event.key === 'Backspace' && !solved) { event.preventDefault(); if (chosen.length) remove(chosen.length - 1); }
    else if (event.key === 'Enter' && event.target.tagName !== 'BUTTON' && event.target.tagName !== 'A') { event.preventDefault(); solved ? next() : check(); }
  });
  restart();
})();
