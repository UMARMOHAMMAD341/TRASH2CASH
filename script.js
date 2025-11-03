/* script.js - Frontend app for TrashToCash (LocalStorage + Backend Hybrid)
   Features:
   - LocalStorage fallback for offline.
   - Auto-sync listings, purchases, wallets with backend.
   - Works for both Buyer and Seller dashboards.
   - Auto-detects backend (localhost or Render).
*/

// 🔧 Dynamic API base (works locally and on Render)
const API_BASE = window.location.hostname.includes("localhost")
  ? "http://localhost:5000"
  : window.location.origin;

// small helpers
const _get = (k)=> JSON.parse(localStorage.getItem(k) || '[]');
const _set = (k,v)=> localStorage.setItem(k, JSON.stringify(v));
const _getObj = (k)=> JSON.parse(localStorage.getItem(k) || '{}');
const _setObj = (k,v)=> localStorage.setItem(k, JSON.stringify(v));
function showMsg(el, txt, color){ if(!el) return; el.textContent = txt; el.style.color = color || ''; }

// 🧱 Initialize all required localStorage keys
["users","wasteListings","transactions","contacts"].forEach(k=>{
  if(localStorage.getItem(k)===null) localStorage.setItem(k,"[]");
});
if(localStorage.getItem("wallets")===null) localStorage.setItem("wallets","{}");

// Auto-redirect if logged in
(function(){
  const file = location.pathname.split('/').pop();
  const logged = localStorage.getItem('loggedUser');
  if(logged && (file === '' || file === 'index.html' || file === 'login.html' || file === 'signup.html')) {
    location.href = 'role.html';
  }
})();

// SIGNUP
const signupForm = document.getElementById('signupForm');
if(signupForm){
  signupForm.addEventListener('submit', e=>{
    e.preventDefault();
    const name = document.getElementById('sname').value.trim();
    const email = document.getElementById('semail').value.trim().toLowerCase();
    const phone = document.getElementById('sphone').value.trim();
    const pass = document.getElementById('spass').value.trim();
    const out = document.getElementById('signupMsg');
    if(!name||!email||!phone||!pass){ showMsg(out,'Please fill all fields','crimson'); return; }

    let users = _get('users');
    if(users.find(u=>u.email===email || u.phone===phone)){ showMsg(out,'User already exists','crimson'); return; }
    users.push({name,email,phone,pass});
    _set('users',users);
    showMsg(out,'Registered! Redirecting...','green');
    setTimeout(()=> location.href='login.html',700);
  });
}

// LOGIN
const loginForm = document.getElementById('loginForm');
if(loginForm){
  loginForm.addEventListener('submit', e=>{
    e.preventDefault();
    const id = document.getElementById('loginUser').value.trim().toLowerCase();
    const pass = document.getElementById('loginPass').value.trim();
    const out = document.getElementById('loginMsg');
    if(!id||!pass){ showMsg(out,'Enter both fields','crimson'); return; }

    const users = _get('users');
    const found = users.find(u=> (u.email===id || u.phone===id) && u.pass===pass);
    if(found){
      localStorage.setItem('loggedUser', found.name);
      showMsg(out,'Login success!','green');
      setTimeout(()=> location.href='role.html',600);
    } else {
      showMsg(out,'Invalid credentials','crimson');
    }
  });
}

// LOGOUT (global)
document.addEventListener('click', e=>{
  const target = e.target;
  if(target && (target.id === 'logoutBtn' || target.closest && target.closest('#logoutBtn'))){
    localStorage.removeItem('loggedUser');
    localStorage.removeItem('userRole');
    location.href='index.html';
  }
});

// Protect pages
(function(){
  const file = location.pathname.split('/').pop();
  const protectedPages = ['role.html','seller-dashboard.html','buyer-dashboard.html','contact.html','project.html','about.html','how.html'];
  if(!localStorage.getItem('loggedUser') && protectedPages.includes(file)){
    location.href = 'login.html';
  }
})();

// ================= SELLER DASHBOARD =================
if(document.getElementById('wasteForm') || document.getElementById('addListing')){
  const sellerName = localStorage.getItem('loggedUser') || 'Seller';
  const sellerSpan = document.getElementById('sellerName');
  if(sellerSpan) sellerSpan.textContent = sellerName;

  const wallets = _getObj('wallets');
  if(typeof wallets[sellerName] === 'undefined'){ wallets[sellerName] = 0; _setObj('wallets', wallets); }
  const sellerBalanceEl = document.getElementById('sellerBalance');
  if(sellerBalanceEl) sellerBalanceEl.textContent = (wallets[sellerName] || 0).toFixed(2);

  const wasteForm = document.getElementById('wasteForm');
  const wasteType = document.getElementById('wasteType');
  const wasteWeight = document.getElementById('wasteWeight');
  const pricePerKg = document.getElementById('pricePerKg');
  const totalCost = document.getElementById('totalCost');
  const locationInput = document.getElementById('location');
  const wasteGrid = document.getElementById('wasteGrid');
  const addBtn = document.getElementById('addListing');
  const viewMyBtn = document.getElementById('viewMy');
  const clearAllBtn = document.getElementById('clearAll');
  const syncMsg = document.getElementById('syncStatus');

  async function renderMyListings(){
    const all = _get('wasteListings');
    const my = all.filter(i=> i.seller === sellerName);
    if(!wasteGrid) return;
    if(!my.length){ wasteGrid.innerHTML = '<p class="muted">No listings yet.</p>'; return; }
    wasteGrid.innerHTML = my.slice().reverse().map(i=>`
      <div class="entry">
        <div class="title">${i.type} — ${i.weight}kg</div>
        <div class="muted">Price: ₹${i.price}/kg • Total: ₹${(i.weight*i.price).toFixed(2)}</div>
        <div class="muted">Location: ${i.location}</div>
      </div>`).join('');
  }
  renderMyListings();

  if(wasteWeight && pricePerKg && totalCost){
    const calc = ()=> totalCost.value = (parseFloat(wasteWeight.value||0)*parseFloat(pricePerKg.value||0) || 0)
      ? '₹'+(parseFloat(wasteWeight.value||0)*parseFloat(pricePerKg.value||0)).toFixed(2) : '';
    wasteWeight.addEventListener('input', calc); pricePerKg.addEventListener('input', calc);
  }

  if(addBtn){
    addBtn.addEventListener('click', async ()=>{
      const type = wasteType.value;
      const weight = parseFloat(wasteWeight.value);
      const price = parseFloat(pricePerKg.value);
      const loc = locationInput.value.trim();
      if(!type||!weight||!price||!loc){ alert('Please fill all fields'); return; }

      const item = { id: Date.now(), seller: sellerName, type, weight, price, location: loc };
      const all = _get('wasteListings'); all.push(item); _set('wasteListings', all);
      wasteForm.reset(); renderMyListings();
      alert('Listing added!');

      // sync with backend
      try {
        if(syncMsg) syncMsg.textContent = "🔄 Syncing with server...";
        const res = await fetch(`${API_BASE}/api/listings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seller_id: 1,
            waste_type: type,
            weight,
            price_per_kg: price,
            total_cost: weight * price,
            location: loc
          })
        });
        if(res.ok){ if(syncMsg) syncMsg.textContent = "✅ Synced successfully"; }
        else { if(syncMsg) syncMsg.textContent = "⚠️ Sync failed"; }
      } catch(e){ if(syncMsg) syncMsg.textContent = "Offline mode: stored locally"; }
    });
  }

  if(viewMyBtn) viewMyBtn.addEventListener('click', renderMyListings);

  if(clearAllBtn){
    clearAllBtn.addEventListener('click', ()=>{
      if(!confirm('Clear all your listings?')) return;
      const left = _get('wasteListings').filter(i=> i.seller !== sellerName);
      _set('wasteListings', left);
      renderMyListings();
    });
  }

  setInterval(()=> {
    const ws = _getObj('wallets');
    if(sellerBalanceEl) sellerBalanceEl.textContent = (ws[sellerName]||0).toFixed(2);
  }, 1000);
}

// ================= BUYER DASHBOARD =================
if(document.getElementById('marketList') || document.getElementById('applyFilter')){
  const buyer = localStorage.getItem('loggedUser') || 'Buyer';
  const marketList = document.getElementById('marketList');
  const filterType = document.getElementById('filterType');
  const filterLocation = document.getElementById('filterLocation');
  const applyFilter = document.getElementById('applyFilter');
  const clearFilter = document.getElementById('clearFilter');
  const viewPurchases = document.getElementById('viewPurchases');
  const buyerTxDiv = document.getElementById('buyerTx');

  async function renderMarket(){
    let all = _get('wasteListings');
    try {
      const res = await fetch(`${API_BASE}/api/listings`);
      if(res.ok) all = await res.json();
    } catch { console.warn("Offline mode: showing local listings"); }

    const t = (filterType && filterType.value) || 'All';
    const loc = (filterLocation && filterLocation.value || '').trim().toLowerCase();
    if(t && t !== 'All') all = all.filter(i=> (i.type||i.waste_type) === t);
    if(loc) all = all.filter(i=> (i.location||'').toLowerCase().includes(loc));
    if(!marketList) return;
    if(!all.length){ marketList.innerHTML = '<p class="muted">No listings available.</p>'; return; }

    marketList.innerHTML = all.slice().reverse().map(i=>`
      <div class="entry">
        <div class="title">${i.waste_type || i.type} — ${i.weight}kg</div>
        <div class="muted">Seller: ${i.seller || 'Unknown'} • ${i.location}</div>
        <div class="muted">Price: ₹${i.price_per_kg || i.price}/kg • Total: ₹${i.total_cost || (i.weight*i.price).toFixed(2)}</div>
        <div style="display:flex;justify-content:flex-end;margin-top:10px;">
          <button class="btn small" onclick="buyItem(${i.id})"><i class="fa-solid fa-cart-shopping"></i> Buy Now</button>
        </div>
      </div>`).join('');
  }

  window.buyItem = async function(id){
    if(!confirm('Confirm purchase?')) return;
    let all = _get('wasteListings');
    let item = all.find(x=> x.id === id);
    let total = item ? Math.round(item.weight * item.price * 100)/100 : 0;

    if(item){
      const wallets = _getObj('wallets');
      wallets[item.seller] = (wallets[item.seller]||0) + total;
      _setObj('wallets', wallets);
      const tx = _get('transactions');
      tx.push({ id: Date.now(), from: buyer, to: item.seller, type: item.type, weight: item.weight, amount: total, location: item.location, when: new Date().toLocaleString() });
      _set('transactions', tx);
      all = all.filter(x=> x.id !== id); _set('wasteListings', all);
      alert(`Purchased ${item.type} for ₹${total.toFixed(2)}`);
      renderMarket(); renderBuyerTx();
    }

    try {
      await fetch(`${API_BASE}/api/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: id, buyer_name: buyer })
      });
    } catch { console.warn("Offline mode: Purchase saved locally"); }
  };

  function renderBuyerTx(){
    const tx = _get('transactions').filter(t=> t.from === buyer);
    if(!buyerTxDiv) return;
    if(!tx.length){ buyerTxDiv.innerHTML = '<p class="muted">No purchases yet.</p>'; return; }
    buyerTxDiv.innerHTML = tx.slice().reverse().map(t=>`
      <div class="entry">
        <div class="title">${t.type} — ${t.weight}kg</div>
        <div class="muted">Seller: ${t.to} • ₹${t.amount.toFixed(2)} • ${t.location}</div>
        <div class="small muted">${t.when}</div>
      </div>
    `).join('');
  }

  if(applyFilter) applyFilter.addEventListener('click', renderMarket);
  if(clearFilter) clearFilter.addEventListener('click', ()=>{ if(filterType) filterType.value='All'; if(filterLocation) filterLocation.value=''; renderMarket(); });
  if(viewPurchases) viewPurchases.addEventListener('click', ()=>{ renderBuyerTx(); window.scrollTo({ top: buyerTxDiv.getBoundingClientRect().top + window.scrollY - 80, behavior:'smooth' }); });

  renderMarket(); renderBuyerTx();
  setInterval(renderMarket,5000);
}

// CONTACT FORM
const contactForm = document.getElementById('contactForm');
if(contactForm){
  contactForm.addEventListener('submit', e=>{
    e.preventDefault();
    const name = document.getElementById('cname').value.trim();
    const email = document.getElementById('cemail').value.trim();
    const message = document.getElementById('cmessage').value.trim();
    const out = document.getElementById('contactMsg');
    if(!name||!email||!message){ showMsg(out,'Fill all fields','crimson'); return; }
    const contacts = _get('contacts'); contacts.push({id:Date.now(),name,email,message,when:new Date().toLocaleString()}); _set('contacts',contacts);
    showMsg(out,'Message sent — thank you!','green'); contactForm.reset();
  });
}
