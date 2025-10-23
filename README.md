# Trash2Cash — Frontend Demo

## Run locally
1. Save the file tree.
2. From the `trash2cash` folder run a simple static server:
   - Python: `python -m http.server 8000` (then open http://localhost:8000)
   - Or use VS Code Live Server / any static host.

## What this contains
- Modern UI with Tailwind CSS
- Login/register (client-side demo using Web Crypto SHA-256)
- Services marketplace and request pickup flow
- Dashboard with Chart.js and simulated "real-time" updates using localStorage and timers

## Next (recommended for real project)
- Replace client-only auth with a backend (Node/Express + DB) or Firebase Auth
- Serve a real REST API for pickups & services (store in DB)
- Use WebSockets (Socket.io) for true realtime UI updates
- Add server-side validation, secure sessions, and TLS

