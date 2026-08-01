const express = require("express");
const db = require("../db");
const { requireAuth } = require("../lib/auth");

const router = express.Router();

router.get("/", requireAuth, (req, res) => {
  const { start, end } = req.query;
  const today = new Date().toISOString().slice(0, 10);
  const startDate = start || today;
  const endDate = end || today;

  const orders = db
    .prepare(
      `SELECT * FROM orders
       WHERE status != 'Voided' AND date(created_at) BETWEEN date(@start) AND date(@end)
       ORDER BY created_at`
    )
    .all({ start: startDate, end: endDate });

  const itemTotals = {};
  const paymentTotals = {};
  let revenue = 0;
  let costOfGoods = 0;

  for (const order of orders) {
    const items = JSON.parse(order.items);
    revenue += order.total;
    for (const item of items) {
      const key = item.name;
      if (!itemTotals[key]) {
        itemTotals[key] = { name: key, qty: 0, revenue: 0 };
      }
      itemTotals[key].qty += item.quantity;
      itemTotals[key].revenue += item.line_total;
    }
    paymentTotals[order.payment_method] =
      (paymentTotals[order.payment_method] || 0) + order.total;
  }

  const daily = {};
  for (const order of orders) {
    const day = order.created_at.slice(0, 10);
    if (!daily[day]) daily[day] = { day, orders: 0, sales: 0 };
    daily[day].orders += 1;
    daily[day].sales += order.total;
  }

  res.json({
    start: startDate,
    end: endDate,
    orderCount: orders.length,
    revenue: round(revenue),
    averageOrder: round(orders.length ? revenue / orders.length : 0),
    daily: Object.values(daily).sort((a, b) => (a.day < b.day ? -1 : 1)),
    items: Object.values(itemTotals).sort((a, b) => b.qty - a.qty),
    payments: paymentTotals
  });
});

function round(value) {
  return Math.round(value * 100) / 100;
}

module.exports = router;
