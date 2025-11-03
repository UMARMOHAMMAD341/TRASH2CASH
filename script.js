/* script.js - Frontend app for TrashToCash (LocalStorage + Backend Hybrid)
   Enhanced Version:
   ✅ LocalStorage fallback for offline use.
   ✅ Auto-sync listings, users, contacts, and transactions with backend.
   ✅ Detects online/offline mode.
   ✅ Works for both Buyer and Seller dashboards.
*/

// 🌐 Dynamic API base (auto-detect Render or Local)
const API_BASE = window.location.hostname.includes("localhost")
  ? "http://localhost:5000"
  : window.location.origin;

// 📡 Network check
let online = navigator.onLine;
window.addEventListener("online", () => { online = true; showStatus("🟢 Online"); });
window.addEventListener("offline", () => { online = false; showStatus("🔴 Offline"); });

function showStatus(txt) {
  let el = document.getElementById("netStatus");
  if (!el) {
    el = document.createElement("div");
    el.id = "netStatus";
    el.style.position = "fixed";
    el.style.bottom = "10px";
    el.style.right = "10px";
    el.style.background = "#222";
    el.style.color = "#fff";
    el.style.padding = "5px 10px";
    el.style.borderRadius = "10px";
    el.style.fontSize = "12px";
    el.style.zIndex = "9999";
    document.body.appendChild(el);
  }
  el.textContent = txt;
}

// LocalStorage helpers
const _get = (k) => JSON.parse(localStorage.getItem(k) || "[]");
const _set = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const _getObj = (k) => JSON.parse(localStorage.getItem(k) || "{}");
const _setObj = (k, v) => localStorage.setItem(k, JSON.stringify(v));
function showMsg(el, txt, color) { if (el) { el.textContent = txt; el.style.color = color || ""; } }

// Initialize
["users", "wasteListings", "transactions", "contacts"].forEach(k => {
  if (localStorage.getItem(k) === null) localStorage.setItem(k, "[]");
});
if (localStorage.getItem("wallets") === null) localStorage.setItem("wallets", "{}");

// Auto redirect after login
(function () {
  const file = location.pathname.split("/").pop();
  const logged = localStorage.getItem("loggedUser");
  if (logged && (file === "" || file === "index.html" || file === "login.html" || file === "signup.html")) {
    location.href = "role.html";
  }
})();

// SIGNUP
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async e => {
    e.preventDefault();
    const name = document.getElementById("sname").value.trim();
    const email = document.getElementById("semail").value.trim().toLowerCase();
    const phone = document.getElementById("sphone").value.trim();
    const pass = document.getElementById("spass").value.trim();
    const out = document.getElementById("signupMsg");
    if (!name || !email || !phone || !pass) return showMsg(out, "Please fill all fields", "crimson");

    let users = _get("users");
    if (users.find(u => u.email === email || u.phone === phone)) return showMsg(out, "User already exists", "crimson");

    users.push({ name, email, phone, pass });
    _set("users", users);
    showMsg(out, "Registered! Redirecting...", "green");

    // Sync to backend
    if (online) {
      try {
        await fetch(`${API_BASE}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone, password: pass })
        });
      } catch {
        console.warn("Backend offline — saved locally");
      }
    }

    setTimeout(() => location.href = "login.html", 800);
  });
}

// LOGIN
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", e => {
    e.preventDefault();
    const id = document.getElementById("loginUser").value.trim().toLowerCase();
    const pass = document.getElementById("loginPass").value.trim();
    const out = document.getElementById("loginMsg");
    if (!id || !pass) return showMsg(out, "Enter both fields", "crimson");

    const users = _get("users");
    const found = users.find(u => (u.email === id || u.phone === id) && u.pass === pass);
    if (found) {
      localStorage.setItem("loggedUser", found.name);
      showMsg(out, "Login success!", "green");
      setTimeout(() => location.href = "role.html", 600);
    } else showMsg(out, "Invalid credentials", "crimson");
  });
}

// LOGOUT
document.addEventListener("click", e => {
  const target = e.target;
  if (target && (target.id === "logoutBtn" || target.closest?.("#logoutBtn"))) {
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("userRole");
    location.href = "index.html";
  }
});

// Protect routes
(function () {
  const file = location.pathname.split("/").pop();
  const restricted = ["role.html", "seller-dashboard.html", "buyer-dashboard.html", "contact.html"];
  if (!localStorage.getItem("loggedUser") && restricted.includes(file)) location.href = "login.html";
})();

// ================= SELLER DASHBOARD =================
if (document.getElementById("wasteForm")) {
  const sellerName = localStorage.getItem("loggedUser") || "Seller";
  const sellerSpan = document.getElementById("sellerName");
  if (sellerSpan) sellerSpan.textContent = sellerName;

  const wallets = _getObj("wallets");
  if (wallets[sellerName] === undefined) { wallets[sellerName] = 0; _setObj("wallets", wallets); }
  const balanceEl = document.getElementById("sellerBalance");
  if (balanceEl) balanceEl.textContent = (wallets[sellerName] || 0).toFixed(2);

  const wasteGrid = document.getElementById("wasteGrid");
  async function renderMyListings() {
    const all = _get("wasteListings").filter(i => i.seller === sellerName);
    wasteGrid.innerHTML = all.length
      ? all.map(i => `<div class="entry"><b>${i.type}</b> - ₹${i.price}/kg (${i.weight}kg)</div>`).join("")
      : "<p class='muted'>No listings yet.</p>";
  }
  renderMyListings();

  document.getElementById("addListing")?.addEventListener("click", async () => {
    const type = document.getElementById("wasteType").value;
    const weight = parseFloat(document.getElementById("wasteWeight").value);
    const price = parseFloat(document.getElementById("pricePerKg").value);
    const loc = document.getElementById("location").value.trim();
    if (!type || !weight || !price || !loc) return alert("Fill all fields");

    const item = { id: Date.now(), seller: sellerName, type, weight, price, location: loc };
    const all = _get("wasteListings"); all.push(item); _set("wasteListings", all);
    renderMyListings(); alert("Listing added!");

    if (online) {
      try {
        await fetch(`${API_BASE}/api/listings`, {
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
      } catch { console.warn("Server unreachable — listing saved locally"); }
    }
  });
}

// ================= BUYER DASHBOARD =================
if (document.getElementById("marketList")) {
  const buyer = localStorage.getItem("loggedUser") || "Buyer";
  const marketList = document.getElementById("marketList");

  async function renderMarket() {
    let all = _get("wasteListings");
    if (online) {
      try {
        const res = await fetch(`${API_BASE}/api/listings`);
        if (res.ok) all = await res.json();
      } catch { console.warn("Backend unavailable"); }
    }
    marketList.innerHTML = all.length
      ? all.map(i => `
        <div class="entry">
          <b>${i.waste_type || i.type}</b> - ₹${i.price_per_kg || i.price}/kg
          <button class="btn small" onclick="buyItem(${i.id})">Buy</button>
        </div>`).join("")
      : "<p>No listings available.</p>";
  }

  window.buyItem = async (id) => {
    if (!confirm("Confirm purchase?")) return;
    const all = _get("wasteListings");
    const item = all.find(x => x.id === id);
    if (!item) return alert("Item unavailable");

    const wallets = _getObj("wallets");
    wallets[item.seller] = (wallets[item.seller] || 0) + item.weight * item.price;
    _setObj("wallets", wallets);

    const tx = _get("transactions");
    tx.push({
      id: Date.now(),
      from: buyer,
      to: item.seller,
      type: item.type,
      weight: item.weight,
      amount: item.weight * item.price,
      when: new Date().toLocaleString()
    });
    _set("transactions", tx);

    _set("wasteListings", all.filter(x => x.id !== id));
    alert(`Purchased ${item.type} for ₹${(item.weight * item.price).toFixed(2)}`);
    renderMarket();

    if (online) {
      try {
        await fetch(`${API_BASE}/api/purchase`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listing_id: id, buyer_name: buyer })
        });
      } catch { console.warn("Purchase saved locally (offline)"); }
    }
  };

  renderMarket();
  setInterval(renderMarket, 7000);
}

// CONTACT FORM
const contactForm = document.getElementById("contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", async e => {
    e.preventDefault();
    const name = document.getElementById("cname").value.trim();
    const email = document.getElementById("cemail").value.trim();
    const message = document.getElementById("cmessage").value.trim();
    const out = document.getElementById("contactMsg");
    if (!name || !email || !message) return showMsg(out, "Fill all fields", "crimson");

    const contacts = _get("contacts"); 
    contacts.push({ id: Date.now(), name, email, message, when: new Date().toLocaleString() });
    _set("contacts", contacts);
    showMsg(out, "Message sent — thank you!", "green"); 
    contactForm.reset();

    if (online) {
      try {
        await fetch(`${API_BASE}/api/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, message })
        });
      } catch { console.warn("Contact saved locally (offline mode)"); }
    }
  });
}
