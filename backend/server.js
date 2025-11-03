const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./db");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Test Route
app.get("/", (req, res) => {
  res.send("Trash2Cash backend is live 🚀");
});


// ✅ Add Listing (Seller)
app.post("/api/listings", (req, res) => {
  const { seller_id, waste_type, weight, price_per_kg, total_cost, location } = req.body;

  if (!seller_id || !waste_type || !weight || !price_per_kg || !total_cost || !location) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = `INSERT INTO listings 
               (seller_id, waste_type, weight, price_per_kg, total_cost, location, status)
               VALUES (?,?,?,?,?,?, 'available')`;

  db.query(sql, [seller_id, waste_type, weight, price_per_kg, total_cost, location], (err, result) => {
    if (err) {
      console.error("❌ Error inserting listing:", err);
      return res.status(500).json({ error: "Database insert failed" });
    }
    res.json({ success: true, listing_id: result.insertId });
  });
});


// ✅ Get all available listings (Buyer)
app.get("/api/listings", (req, res) => {
  const sql = "SELECT * FROM listings WHERE status='available'";
  db.query(sql, (err, result) => {
    if (err) {
      console.error("❌ Error fetching listings:", err);
      return res.status(500).json({ error: "Database fetch failed" });
    }
    res.json(result);
  });
});


// ✅ Get Seller’s Listings
app.get("/api/listings/seller/:sellerId", (req, res) => {
  const { sellerId } = req.params;
  const sql = "SELECT * FROM listings WHERE seller_id=?";
  db.query(sql, [sellerId], (err, result) => {
    if (err) {
      console.error("❌ Error fetching seller listings:", err);
      return res.status(500).json({ error: "Database fetch failed" });
    }
    res.json(result);
  });
});


// ✅ Buyer purchases a listing
app.post("/api/purchase", (req, res) => {
  const { listing_id, buyer_name } = req.body;

  if (!listing_id || !buyer_name) {
    return res.status(400).json({ error: "Listing ID and buyer name required" });
  }

  const findListing = "SELECT * FROM listings WHERE id=? AND status='available'";

  db.query(findListing, [listing_id], (err, result) => {
    if (err) return res.status(500).json({ error: "Database query failed" });
    if (result.length === 0) return res.status(404).json({ error: "Listing not available" });

    const listing = result[0];

    // Start purchase process
    const markSold = "UPDATE listings SET status='sold' WHERE id=?";
    const addPurchase = "INSERT INTO purchases (listing_id, buyer_name, amount) VALUES (?,?,?)";
    const updateSeller = "UPDATE sellers SET balance = balance + ? WHERE id=?";

    db.query(markSold, [listing_id], err => {
      if (err) console.error("❌ Error updating listing status:", err);
    });

    db.query(addPurchase, [listing_id, buyer_name, listing.total_cost], err => {
      if (err) console.error("❌ Error adding purchase:", err);
    });

    db.query(updateSeller, [listing.total_cost, listing.seller_id], err => {
      if (err) console.error("❌ Error updating seller balance:", err);
    });

    res.json({ success: true, message: "Purchase successful ✅" });
  });
});


// ✅ View Buyer Purchases
app.get("/api/purchases/:buyerName", (req, res) => {
  const { buyerName } = req.params;
  const sql = "SELECT * FROM purchases WHERE buyer_name=?";
  db.query(sql, [buyerName], (err, result) => {
    if (err) {
      console.error("❌ Error fetching purchases:", err);
      return res.status(500).json({ error: "Database fetch failed" });
    }
    res.json(result);
  });
});


// ✅ Clear Seller Listings
app.delete("/api/listings/:sellerId", (req, res) => {
  const { sellerId } = req.params;
  const sql = "DELETE FROM listings WHERE seller_id=?";
  db.query(sql, [sellerId], err => {
    if (err) {
      console.error("❌ Error deleting listings:", err);
      return res.status(500).json({ error: "Database delete failed" });
    }
    res.json({ success: true, message: "Seller listings cleared ✅" });
  });
});


// ✅ Server Listen
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Trash2Cash backend running on http://localhost:${PORT}`));
