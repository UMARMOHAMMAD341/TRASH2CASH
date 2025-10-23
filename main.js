// main.js - shared utilities & lightweight store + tilt
const store = {
  get(key, fallback = null) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  remove(key) { localStorage.removeItem(key); }
};

function formatDate(ts = Date.now()) {
  return new Date(ts).toLocaleString();
}

function ensureSeed(key, seed) {
  if (store.get(key) == null) store.set(key, seed);
}

/* tilt effect for elements with data-tilt */
function initTilt() {
  document.querySelectorAll('[data-tilt]').forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width/2;
      const y = e.clientY - rect.top - rect.height/2;
      const rx = (y / rect.height) * -8;
      const ry = (x / rect.width) * 8;
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(10px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = 'none'; });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // initialize tilt
  initTilt();

  // seed demo data if empty
  ensureSeed('t2c_stats', { totalWasteKg: 12500, totalUsers: 4500, totalPoints: 320000 });
  // demo user if no users exist
  if (store.get('t2c_users') == null) {
    store.set('t2c_users', [
      { id: 'u_demo', name: 'Demo User', email: 'demo@trash2cash.test', passwordHash: '', ecoPoints: 120, completedPickups: 4, pendingPickups: 1, uploadedItems: 5, joined: Date.now() }
    ]);
  }
});
