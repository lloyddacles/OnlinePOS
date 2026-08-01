const express = require("express");
const db = require("../db");
const { requireAuth } = require("../lib/auth");

const router = express.Router();

router.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM settings ORDER BY key")
    .all()
    .map((row) => ({ key: row.key, value: row.value }));
  res.json(rows);
});

router.put("/", requireAuth, (req, res) => {
  const updates = req.body;
  if (!updates || typeof updates !== "object") {
    return res.status(400).json({ error: "Invalid settings payload" });
  }

  const update = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );

  const apply = db.transaction((pairs) => {
    for (const [key, value] of pairs) update.run(key, String(value));
  });

  const pairs = Object.entries(updates).filter(([key]) =>
    ["store_name", "store_address", "store_phone", "tax_rate", "receipt_footer"].includes(key)
  );
  apply(pairs);

  res.json({ success: true });
});

module.exports = router;
