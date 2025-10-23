// services.js
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('servicesContainer');
  const search = document.getElementById('serviceSearch');
  const searchBtn = document.getElementById('searchBtn');

  function getServices() { return store.get('t2c_services', []); }

  function render(list) {
    if (!container) return;
    container.innerHTML = list.map(s => `
      <div class="glass-card p-5 rounded-2xl shadow-lg">
        <h4 class="text-lg font-semibold text-white">${s.name}</h4>
        <p class="text-slate-300 mt-2">${s.desc || ''}</p>
        <div class="mt-4 flex items-center justify-between">
          <div class="text-slate-400 text-sm">Reward: <strong>${s.points} EcoPoints</strong></div>
          <button class="btn-3d" onclick="requestPickup('${s.id}')">Request Pickup</button>
        </div>
      </div>
    `).join('');
  }

  window.requestPickup = (serviceId) => {
    const user = store.get('t2c_user');
    if (!user) { alert('Please login to request a pickup.'); window.location.href = 'login.html'; return; }
    const services = getServices();
    const s = services.find(x => x.id === serviceId);
    if (!s) return alert('Service not found');

    const pickups = store.get('t2c_pickups', []);
    const p = { id:'p_'+Date.now(), userId:user.id, serviceId, name:s.name, points:s.points, status:'pending', requestedAt:Date.now() };
    pickups.push(p);
    store.set('t2c_pickups', pickups);

    // update user
    const users = store.get('t2c_users', []);
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) { users[idx].pendingPickups = (users[idx].pendingPickups||0)+1; store.set('t2c_users', users); }

    const activities = store.get('t2c_activity', []);
    activities.unshift({ ts: Date.now(), text: `Requested pickup: ${s.name}` });
    store.set('t2c_activity', activities.slice(0,200));

    alert(`Pickup requested: ${s.name}`);
    window.dispatchEvent(new Event('t2c_state_changed'));
  };

  if (searchBtn) searchBtn.addEventListener('click', () => {
    const term = (search.value||'').toLowerCase();
    render(getServices().filter(s => s.name.toLowerCase().includes(term) || (s.desc||'').toLowerCase().includes(term)));
  });

  render(getServices());
});
