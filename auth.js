// auth.js - simple client-side auth (DEMO ONLY)
async function hashPassword(password) {
  const enc = new TextEncoder();
  const arr = enc.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', arr);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  // register
  const regForm = document.getElementById('registerForm');
  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (document.getElementById('fullname').value || '').trim();
      const email = (document.getElementById('regEmail').value || '').trim().toLowerCase();
      const pass = (document.getElementById('regPassword').value || '');
      if (!name || !email || pass.length < 6) return alert('Provide name, valid email and password (>=6).');

      let users = store.get('t2c_users', []);
      if (users.find(u => u.email === email)) return alert('Email already registered.');

      const hashed = await hashPassword(pass);
      const newUser = { id: 'u_' + Date.now(), name, email, passwordHash: hashed, ecoPoints: 0, completedPickups:0, pendingPickups:0, uploadedItems:0, joined: Date.now() };
      users.push(newUser);
      store.set('t2c_users', users);
      store.set('t2c_user', { id: newUser.id, name: newUser.name, email: newUser.email });
      alert('Account created — redirecting to Dashboard');
      window.location.href = 'dashboard.html';
    });
  }

  // login
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (document.getElementById('email').value || '').trim().toLowerCase();
      const pass = (document.getElementById('password').value || '');
      if (!email || !pass) return alert('Enter credentials.');

      const users = store.get('t2c_users', []);
      const found = users.find(u => u.email === email);
      if (!found) return alert('Account not found. Use demo@trash2cash.test or register.');

      // if demo user has empty passwordHash accept any password (for convenience)
      if (!found.passwordHash) {
        store.set('t2c_user', { id: found.id, name: found.name, email: found.email });
        window.location.href = 'dashboard.html';
        return;
      }

      const hashed = await hashPassword(pass);
      if (hashed !== found.passwordHash) return alert('Incorrect password.');
      store.set('t2c_user', { id: found.id, name: found.name, email: found.email });
      window.location.href = 'dashboard.html';
    });
  }

  // logout link
  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      store.remove('t2c_user');
      window.location.href = 'login.html';
    });
  }
});

// helper for pages that require auth
function requireAuth(redirect = 'login.html') {
  const u = store.get('t2c_user');
  if (!u) { window.location.href = redirect; return null; }
  return u;
}
