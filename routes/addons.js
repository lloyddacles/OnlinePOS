const express = require("express");
const db = require("../db");
const { requireAuth } = require("../lib/auth");

const router = express.Router();

router.get("/", (req, res) => {
  const addons = db
    .prepare("SELECT * FROM addons ORDER BY type, sort_order")
    .all();
  res.json(addons);
});

router.post("/", requireAuth, (req, res) => {
  const { name, type, price = 0, sort_order = 0, category = "", required = false } = req.body;
  if (!name || !["sweetness", "ice", "topping", "size", "flavor"].includes(type)) {
    return res.status(400).json({ error: "Valid name and type required (sweetness|ice|topping|size|flavor)" });
  }
  const result = db
    .prepare("INSERT INTO addons (name, type, price, sort_order, category, required) VALUES (?, ?, ?, ?, ?, ?)")
    .run(name.trim(), type, Number(price) || 0, Number(sort_order) || 0, category || "", required ? 1 : 0);
  const addon = db.prepare("SELECT * FROM addons WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(addon);
});

router.put("/:id", requireAuth, (req, res) => {
  const existing = db.prepare("SELECT * FROM addons WHERE id = ?").get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: "Addon not found" });
  }
  const { name, type, price, sort_order, available, category, required } = req.body;
  db.prepare(
    "UPDATE addons SET name = ?, type = ?, price = ?, sort_order = ?, available = ?, category = ?, required = ? WHERE id = ?"
  ).run(
    name ?? existing.name,
    type ?? existing.type,
    price != null ? Number(price) : existing.price,
    sort_order != null ? Number(sort_order) : existing.sort_order,
    available !== undefined ? (available ? 1 : 0) : existing.available,
    category !== undefined ? category : existing.category,
    required !== undefined ? (required ? 1 : 0) : existing.required,
    req.params.id
  );
  res.json(db.prepare("SELECT * FROM addons WHERE id = ?").get(req.params.id));
});

router.delete("/:id", requireAuth, (req, res) => {
  const result = db.prepare("DELETE FROM addons WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Addon not found" });
  }
  res.json({ success: true });
});

module.exports = router;
