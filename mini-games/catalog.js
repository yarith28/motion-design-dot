(() => {
  const games = [...document.querySelectorAll('[data-category]')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  filters.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filters.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    games.forEach(game => { game.hidden = filter !== 'all' && game.dataset.category !== filter; });
    const count = games.filter(game => !game.hidden).length;
    document.querySelector('.shelf').hidden = !games.some(game => game.classList.contains('game-card') && !game.hidden);
    document.getElementById('game-count').textContent = `${String(count).padStart(2,'0')} ${count === 1 ? 'game' : 'games'} / ready to play`;
  }));
})();
