const express = require("express");
const db = require("../db");
const { requireAuth } = require("../lib/auth");

const router = express.Router();

const CATEGORIES = [
  "Milk Tea",
  "Frappe",
  "Rock Salt & Cheese",
  "Fruit Tea",
  "Yakult",
  "Oreo",
  "Cheesecake",
  "Detox Drinks"
];

router.get("/categories", (req, res) => {
  res.json(CATEGORIES);
});

router.get("/", (req, res) => {
  const { category, available, barcode } = req.query;
  let sql = "SELECT * FROM products WHERE 1=1";
  const params = {};

  if (category && category !== "All") {
    sql += " AND category = @category";
    params.category = category;
  }
  if (available === "true") {
    sql += " AND available = 1";
  }
  if (barcode) {
    sql += " AND barcode = @barcode";
    params.barcode = barcode;
  }

  sql += " ORDER BY category, name";
  const products = db.prepare(sql).all(params);
  res.json(products);
});

router.get("/:id", (req, res) => {
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
});

router.post("/", requireAuth, (req, res) => {
  const { name, category, price, description, barcode } = req.body;
  if (!name || !category || price == null) {
    return res.status(400).json({ error: "Name, category and price are required" });
  }
  if (isNaN(price) || Number(price) < 0) {
    return res.status(400).json({ error: "Invalid price" });
  }

  const result = db
    .prepare(
      "INSERT INTO products (name, category, price, description, barcode) VALUES (?, ?, ?, ?, ?)"
    )
    .run(name.trim(), category, Number(price), description || "", barcode || "");

  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(product);
});

router.put("/:id", requireAuth, (req, res) => {
  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: "Product not found" });
  }

  const { name, category, price, description, available, barcode } = req.body;
  db.prepare(
    "UPDATE products SET name = ?, category = ?, price = ?, description = ?, available = ?, barcode = ? WHERE id = ?"
  ).run(
    name ?? existing.name,
    category ?? existing.category,
    price != null ? Number(price) : existing.price,
    description !== undefined ? description : existing.description,
    available !== undefined ? (available ? 1 : 0) : existing.available,
    barcode !== undefined ? barcode : existing.barcode,
    req.params.id
  );

  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  res.json(product);
});

router.delete("/:id", requireAuth, (req, res) => {
  const result = db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json({ success: true });
});

module.exports = router;
