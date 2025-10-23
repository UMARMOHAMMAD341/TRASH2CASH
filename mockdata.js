// mockdata.js - initial services + stats
document.addEventListener('DOMContentLoaded', () => {
  ensureSeed('t2c_services', [
    { id: 's_plastic', name: 'Plastic Collection', points: 5, desc: 'Bottles, packaging, films.' },
    { id: 's_paper', name: 'Paper & Cardboard', points: 3, desc: 'Newspapers, boxes, cartons.' },
    { id: 's_metal', name: 'Metal Scrap', points: 8, desc: 'Cans, metal parts.' },
    { id: 's_glass', name: 'Glass Collection', points: 6, desc: 'Bottles & jars.' },
    { id: 's_ewaste', name: 'E-Waste Pickup', points: 12, desc: 'Phones, chargers, small appliances.' }
  ]);

  ensureSeed('t2c_activity', [
    { ts: Date.now()-86400000, text: 'Community drive — 300kg recycled' },
    { ts: Date.now()-3600000, text: 'Demo User completed pickup (+12 EcoPoints)' }
  ]);
});
