(() => {
  const catalog = document.getElementById('game-catalog');
  const viewButtons = [...document.querySelectorAll('[data-view-choice]')];
  const viewKey = 'small-hours-catalog-view';
  function setView(view, persist = false) {
    const selected = view === 'list' ? 'list' : 'grid';
    catalog.dataset.view = selected;
    viewButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.viewChoice === selected)));
    if (persist) { try { localStorage.setItem(viewKey, selected); } catch {} }
  }
  try { setView(localStorage.getItem(viewKey)); } catch { setView('grid'); }
  viewButtons.forEach(button => button.addEventListener('click', () => setView(button.dataset.viewChoice, true)));

  const games = [...document.querySelectorAll('[data-category]')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  const search = document.getElementById('game-search');
  const empty = document.getElementById('empty-results');
  let activeFilter = 'all';
  const searchable = new Map(games.map(game => [game, game.textContent.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')]));
  function refresh() {
    const terms = search.value.trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(Boolean);
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === activeFilter)));
    games.forEach(game => { game.hidden = (activeFilter !== 'all' && game.dataset.category !== activeFilter) || !terms.every(term => searchable.get(game).includes(term)); });
    const count = games.filter(game => !game.hidden).length;
    document.querySelector('.shelf').hidden = !games.some(game => game.classList.contains('game-card') && !game.hidden);
    empty.hidden = count > 0;
    document.getElementById('game-count').textContent = `${String(count).padStart(2,'0')} ${count === 1 ? 'game' : 'games'} / ready to play`;
  }
  filters.forEach(button => button.addEventListener('click', () => { activeFilter = button.dataset.filter; refresh(); }));
  search.addEventListener('input', refresh);
  search.addEventListener('keydown', event => { if (event.key === 'Escape') { search.value = ''; refresh(); } });
  document.getElementById('clear-filters').addEventListener('click', () => { activeFilter = 'all'; search.value = ''; refresh(); search.focus(); });
  document.addEventListener('keydown', event => { if (event.key === '/' && !event.altKey && !event.ctrlKey && !event.metaKey && !event.target.closest('input,textarea,[contenteditable]')) { event.preventDefault(); search.focus(); } });
  refresh();
})();
