const express = require("express");
const db = require("../db");
const { requireAuth } = require("../lib/auth");

const router = express.Router();

const round = (value) => Math.round(value * 100) / 100;

router.get("/dashboard", requireAuth, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  const totalSales = db
    .prepare(
      "SELECT COALESCE(SUM(total), 0) AS value FROM orders WHERE status != 'Voided' AND date(created_at) = ?"
    )
    .get(today).value;

  const totalOrders = db
    .prepare(
      "SELECT COUNT(*) AS value FROM orders WHERE status != 'Voided' AND date(created_at) = ?"
    )
    .get(today).value;

  const voidCount = db
    .prepare("SELECT COUNT(*) AS value FROM orders WHERE status = 'Voided' AND date(created_at) = ?")
    .get(today).value;

  const todayOrders = db
    .prepare("SELECT items FROM orders WHERE status != 'Voided' AND date(created_at) = ?")
    .all(today);
  const itemCounts = {};
  let totalItemsSold = 0;
  for (const order of todayOrders) {
    for (const item of JSON.parse(order.items)) {
      totalItemsSold += item.quantity;
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
    }
  }
  const topItem = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0];

  const productCount = db
    .prepare("SELECT COUNT(*) AS value FROM products WHERE available = 1")
    .get().value;

  const categoryCount = db
    .prepare("SELECT COUNT(DISTINCT category) AS value FROM products WHERE available = 1")
    .get().value;

  const recentOrders = db
    .prepare("SELECT * FROM orders ORDER BY id DESC LIMIT 6")
    .all()
    .map((order) => ({ ...order, items: JSON.parse(order.items) }));

  const queue = db
    .prepare("SELECT * FROM orders WHERE status IN ('Completed', 'Ready') ORDER BY id")
    .all()
    .map((order) => ({ ...order, items: JSON.parse(order.items) }));

  res.json({
    totalSales: round(totalSales),
    totalOrders,
    totalItemsSold,
    voidCount,
    topItem: topItem ? topItem[0] : null,
    averageOrder: round(totalOrders ? totalSales / totalOrders : 0),
    productCount,
    categoryCount,
    recentOrders,
    queue
  });
});

router.get("/sales", requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT date(created_at) AS day, COUNT(*) AS orders, SUM(total) AS sales
       FROM orders
       WHERE status != 'Voided'
       GROUP BY date(created_at)
       ORDER BY day DESC
       LIMIT 30`
    )
    .all();

  res.json(rows.map((row) => ({ ...row, sales: round(row.sales) })));
});

module.exports = router;
