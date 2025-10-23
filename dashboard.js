=// dashboard.js
let ecoChart = null;

function buildChart(labels, data) {
  const ctx = document.getElementById('ecoChart').getContext('2d');
  if (ecoChart) ecoChart.destroy();
  ecoChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label:'EcoPoints', data, tension:0.3, fill:true, backgroundColor:'rgba(34,197,94,0.12)', borderColor:'#22c55e' }]},
    options: { responsive:true, plugins:{legend:{display:false}}, scales:{ y:{beginAtZero:true}}}
  });
}

function refreshDashboard() {
  const user = requireAuth();
  if (!user) return;
  const users = store.get('t2c_users', []);
  const me = users.find(u => u.id === user.id) || user;

  document.getElementById('dashUser').textContent = me.name || me.email;
  document.getElementById('ecoPoints').textContent = me.ecoPoints || 0;
  document.getElementById('completedPickups').textContent = me.completedPickups || 0;
  document.getElementById('pendingPickups').textContent = me.pendingPickups || 0;
  document.getElementById('uploadedItems').textContent = me.uploadedItems || 0;

  // activity
  const activity = store.get('t2c_activity', []);
  const list = document.getElementById('activityList');
  if (list) list.innerHTML = activity.slice(0,20).map(a => `<li>${formatDate(a.ts)} — ${a.text}</li>`).join('');

  // timeseries
  let series = store.get('t2c_series_' + user.id);
  if (!series) {
    const now = Date.now();
    series = { labels:[], values:[] };
    for (let i=6;i>=0;i--){
      series.labels.push(new Date(now - i*86400000).toLocaleDateString());
      series.values.push((me.ecoPoints||0) - Math.floor(Math.random()*20));
    }
    store.set('t2c_series_'+user.id, series);
  }
  buildChart(series.labels, series.values);
}

// demo actions
function requestPickupDemo(){ const user = requireAuth(); if(!user) return; const services=store.get('t2c_services',[]); const s=services[Math.floor(Math.random()*services.length)]; if(!s) return; const pickups=store.get('t2c_pickups',[]); const p={id:'p_'+Date.now(), userId:user.id, serviceId:s.id, name:s.name, points:s.points, status:'pending', requestedAt:Date.now()}; pickups.push(p); store.set('t2c_pickups', pickups); const users = store.get('t2c_users',[]); const idx = users.findIndex(u=>u.id===user.id); if(idx>=0){ users[idx].pendingPickups=(users[idx].pendingPickups||0)+1; store.set('t2c_users',users);} const activities = store.get('t2c_activity',[]); activities.unshift({ ts: Date.now(), text: `Requested pickup: ${s.name}`}); store.set('t2c_activity', activities.slice(0,200)); window.dispatchEvent(new Event('t2c_state_changed')); refreshDashboard(); }

function completePickupDemo(){ const user = requireAuth(); if(!user) return; const pickups = store.get('t2c_pickups',[]); const idx = pickups.findIndex(p=>p.userId===user.id && p.status==='pending'); if(idx===-1){ alert('No pending pickups (demo)'); return;} pickups[idx].status='completed'; pickups[idx].completedAt=Date.now(); store.set('t2c_pickups', pickups); const points = pickups[idx].points||5; const users = store.get('t2c_users',[]); const uidx = users.findIndex(u=>u.id===user.id); if(uidx>=0){ users[uidx].pendingPickups = Math.max(0,(users[uidx].pendingPickups||0)-1); users[uidx].completedPickups = (users[uidx].completedPickups||0)+1; users[uidx].ecoPoints = (users[uidx].ecoPoints||0)+points; store.set('t2c_users', users); const seriesKey = 't2c_series_' + user.id; const s = store.get(seriesKey, { labels:[], values:[] }); const label = new Date().toLocaleDateString(); const last = s.values.length? s.values[s.values.length-1] : 0; s.labels.push(label); s.values.push(last + points); if(s.labels.length>14){ s.labels.shift(); s.values.shift(); } store.set(seriesKey, s); } const activities = store.get('t2c_activity',[]); activities.unshift({ ts:Date.now(), text:`Pickup completed (+${points} EcoPoints)`}); store.set('t2c_activity', activities.slice(0,200)); window.dispatchEvent(new Event('t2c_state_changed')); refreshDashboard(); }

function clearActivity(){ store.set('t2c_activity',[]); refreshDashboard(); }

function redeemRewards(){ alert('Redeem flow demo — integrate backend to redeem vouchers.'); }
function toggleDarkMode(){ alert('Dark mode demo — UI is already dark themed.'); }
function downloadCSV(){ alert('CSV download demo.'); }
function uploadCSV(){ alert('Upload CSV demo.'); }
function showNotifications(){ alert('Notifications demo.'); }
function editProfile(){ alert('Edit Profile demo.'); }
function resetPassword(){ alert('Reset password demo.'); }
function searchServices(){ window.location.href = 'services.html'; }
function addService(){ alert('Add Service demo (admin feature).'); }
function removeService(){ alert('Remove Service demo (admin).'); }
function togglePickupStatus(){ alert('Toggle pickup status demo.'); }
function showFAQ(){ alert('FAQ demo popup.'); }
function showActivity(){ window.scrollTo({top: document.getElementById('activityList').offsetTop - 80, behavior:'smooth'}); }
function showChart(){ document.getElementById('ecoChart').scrollIntoView({behavior:'smooth'}); }
function clearUploads(){ alert('Clear uploads (demo).'); }
function clearPickups(){ store.set('t2c_pickups',[]); refreshDashboard(); }
function refreshDashboard(){ refreshDashboardInternal(); }

// internal small wrapper to avoid name collision
function refreshDashboardInternal(){ refreshDashboard(); }

document.addEventListener('DOMContentLoaded', () => {
  // require auth on dashboard page
  if (document.getElementById('ecoChart')) {
    const u = requireAuth();
    if (!u) return;
    refreshDashboard();
    window.addEventListener('t2c_state_changed', () => refreshDashboard());
    // simulated community push
    setInterval(() => {
      if (Math.random() < 0.2) {
        const stats = store.get('t2c_stats', {});
        stats.totalWasteKg = (stats.totalWasteKg || 0) + Math.floor(Math.random()*50);
        stats.totalPoints = (stats.totalPoints || 0) + Math.floor(Math.random()*200);
        store.set('t2c_stats', stats);
        const activities = store.get('t2c_activity', []);
        activities.unshift({ ts: Date.now(), text: 'Community collection increased waste recycled' });
        store.set('t2c_activity', activities.slice(0,200));
        window.dispatchEvent(new Event('t2c_state_changed'));
      }
    }, 12000);
  }
});
