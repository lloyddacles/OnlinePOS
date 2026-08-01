const express = require("express");
const db = require("../db");
const { requireAuth } = require("../lib/auth");

const router = express.Router();

const round = (value) => Math.round(value * 100) / 100;

function getTaxRate() {
  return Number(db.prepare("SELECT value FROM settings WHERE key = 'tax_rate'").get().value || 12) / 100;
}

router.get("/", (req, res) => {
  const { date, status, limit } = req.query;
  let sql = "SELECT * FROM orders WHERE 1=1";
  const params = {};

  if (date) {
    sql += " AND date(created_at) = date(@date)";
    params.date = date;
  }
  if (status) {
    sql += " AND status = @status";
    params.status = status;
  }

  sql += " ORDER BY id DESC";
  if (limit) {
    sql += " LIMIT @limit";
    params.limit = Number(limit);
  }

  res.json(db.prepare(sql).all(params));
});

router.get("/:id", (req, res) => {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  order.items = JSON.parse(order.items);
  res.json(order);
});

router.post("/", (req, res) => {
  const {
    items,
    customer_name = "",
    payment_method = "Cash",
    amount_tendered = 0,
    discount_type = "none",
    discount_value = 0
  } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Order must contain at least one item" });
  }

  const taxRate = getTaxRate();
  const productStmt = db.prepare("SELECT * FROM products WHERE id = ?");
  const subtotal = items.reduce((sum, item) => {
    const product = productStmt.get(item.product_id);
    if (!product) {
      throw { status: 400, message: `Product ${item.product_id} not found` };
    }
    const addonTotal = Array.isArray(item.addons)
      ? item.addons.reduce((s, a) => s + (Number(a.price) || 0), 0)
      : 0;
    return sum + (product.price + addonTotal) * item.quantity;
  }, 0);

  const discount = computeDiscount(discount_type, discount_value, subtotal);
  const taxable = subtotal - discount;
  const tax = taxable * taxRate;
  const total = taxable + tax;
  const change = payment_method === "Cash" ? amount_tendered - total : 0;

  const normalizedItems = items.map((item) => {
    const product = productStmt.get(item.product_id);
    const addons = (Array.isArray(item.addons) ? item.addons : []).map((a) => ({
      id: Number(a.id),
      name: a.name,
      price: Number(a.price) || 0
    }));
    const addonTotal = addons.reduce((s, a) => s + a.price, 0);
    const unit_price = product.price;
    const line_total = (product.price + addonTotal) * item.quantity;
    return {
      product_id: product.id,
      name: product.name,
      unit_price,
      quantity: item.quantity,
      addons,
      line_total: round(line_total)
    };
  });

  const orderNumber = generateOrderNumber();

  const result = db
    .prepare(
      `INSERT INTO orders
        (order_number, customer_name, items, subtotal, discount, discount_type, tax, total,
         payment_method, amount_tendered, change_due, status)
       VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Completed')`
    )
    .run(
      orderNumber,
      customer_name,
      JSON.stringify(normalizedItems),
      round(subtotal),
      round(discount),
      discount_type,
      round(tax),
      round(total),
      payment_method,
      Number(amount_tendered) || 0,
      round(change)
    );

  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(result.lastInsertRowid);
  order.items = JSON.parse(order.items);
  res.status(201).json(order);
});

router.patch("/:id/status", requireAuth, (req, res) => {
  const { status, void_reason = "" } = req.body;
  const allowed = ["Ready", "Picked Up", "Voided"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${allowed.join(", ")}` });
  }

  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  db.prepare("UPDATE orders SET status = ?, void_reason = ? WHERE id = ?").run(
    status,
    status === "Voided" ? void_reason : "",
    req.params.id
  );

  const updated = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
  updated.items = JSON.parse(updated.items);
  res.json(updated);
});

function computeDiscount(type, value, subtotal) {
  switch (type) {
    case "senior":
      return round(subtotal * 0.2);
    case "promo_pct": {
      const pct = Number(value) || 0;
      return round((subtotal * Math.min(Math.max(pct, 0), 100)) / 100);
    }
    case "promo_amt": {
      const amt = Number(value) || 0;
      return round(Math.min(Math.max(amt, 0), subtotal));
    }
    default:
      return 0;
  }
}

function generateOrderNumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const max = db.prepare("SELECT MAX(id) AS maxId FROM orders").get().maxId || 0;
  return `RT-${y}${m}${d}-${String(max + 1).padStart(4, "0")}`;
}

module.exports = router;
