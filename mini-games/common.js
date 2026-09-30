/* Storage is optional. Each record retains a session fallback if storage fails. */
window.SmallHours = {
  record(key, preferLower = false) {
    let value = null, available = true;
    try {
      const raw = localStorage.getItem(key), parsed = Number(raw);
      if (raw !== null && Number.isFinite(parsed) && parsed > 0) value = parsed;
    } catch { available = false; }
    const render = () => {
      document.getElementById('best').textContent = value === null ? '—' : value.toLocaleString();
      document.getElementById('storage-note').textContent = available
        ? 'Saved on this browser.' : 'Storage unavailable. Best kept for this visit.';
    };
    render();
    return {
      save(next) {
        const improved = next > 0 && (value === null || (preferLower ? next < value : next > value));
        if (improved) {
          value = next;
          try { localStorage.setItem(key, String(value)); } catch { available = false; }
        }
        render();
        return improved;
      }
    };
  },
  shuffle(items) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }
};
