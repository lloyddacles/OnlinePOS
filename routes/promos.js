const express = require("express");
const db = require("../db");
const { requireAuth } = require("../lib/auth");

const router = express.Router();

const round = (value) => Math.round(value * 100) / 100;

function checkPromo(promo, subtotal) {
  if (!promo) return { ok: false, error: "Promo code not found" };
  if (!promo.active) return { ok: false, error: "Promo code is inactive" };

  const today = new Date().toISOString().slice(0, 10);
  if (promo.start_date && today < promo.start_date) {
    return { ok: false, error: `Promo starts on ${promo.start_date}` };
  }
  if (promo.end_date && today > promo.end_date) {
    return { ok: false, error: `Promo expired on ${promo.end_date}` };
  }
  if (promo.min_subtotal > subtotal) {
    return {
      ok: false,
      error: `Minimum order of ${fmt(promo.min_subtotal)} required for this promo`
    };
  }
  if (promo.max_uses != null && promo.used_count >= promo.max_uses) {
    return { ok: false, error: "Promo usage limit reached" };
  }

  const discount =
    promo.discount_type === "amount"
      ? Math.min(promo.discount_value, subtotal)
      : (subtotal * promo.discount_value) / 100;

  return { ok: true, promo, discount: round(discount) };
}

function fmt(value) {
  return "₱ " + Number(value || 0).toFixed(2);
}

router.get("/", requireAuth, (req, res) => {
  const promos = db.prepare("SELECT * FROM promos ORDER BY id DESC").all();
  res.json(promos);
});

router.get("/validate", (req, res) => {
  const { code, subtotal } = req.query;
  if (!code) {
    return res.status(400).json({ error: "Promo code is required" });
  }
  const promo = db
    .prepare("SELECT * FROM promos WHERE code = ?")
    .get(String(code).trim().toUpperCase());
  const result = checkPromo(promo, Number(subtotal) || 0);
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }
  res.json({
    code: result.promo.code,
    description: result.promo.description,
    discount: result.discount,
    discount_type: result.promo.discount_type,
    discount_value: result.promo.discount_value
  });
});

router.post("/", requireAuth, (req, res) => {
  const {
    code,
    description = "",
    discount_type = "percent",
    discount_value,
    min_subtotal = 0,
    active = true,
    start_date = "",
    end_date = "",
    max_uses = null
  } = req.body;

  if (!code || discount_value == null) {
    return res.status(400).json({ error: "Code and discount value are required" });
  }
  if (!["percent", "amount"].includes(discount_type)) {
    return res.status(400).json({ error: "discount_type must be percent or amount" });
  }

  const normalizedCode = String(code).trim().toUpperCase();
  const exists = db.prepare("SELECT * FROM promos WHERE code = ?").get(normalizedCode);
  if (exists) {
    return res.status(409).json({ error: "Promo code already exists" });
  }

  const result = db
    .prepare(
      `INSERT INTO promos
        (code, description, discount_type, discount_value, min_subtotal, active, start_date, end_date, max_uses)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      normalizedCode,
      description,
      discount_type,
      Number(discount_value),
      Number(min_subtotal) || 0,
      active ? 1 : 0,
      start_date || "",
      end_date || "",
      max_uses != null ? Number(max_uses) : null
    );

  const promo = db.prepare("SELECT * FROM promos WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(promo);
});

router.put("/:id", requireAuth, (req, res) => {
  const existing = db.prepare("SELECT * FROM promos WHERE id = ?").get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: "Promo not found" });
  }

  const {
    code,
    description,
    discount_type,
    discount_value,
    min_subtotal,
    active,
    start_date,
    end_date,
    max_uses
  } = req.body;

  const newCode = code !== undefined ? String(code).trim().toUpperCase() : existing.code;
  if (newCode !== existing.code) {
    const dup = db.prepare("SELECT * FROM promos WHERE code = ? AND id != ?").get(newCode, req.params.id);
    if (dup) {
      return res.status(409).json({ error: "Promo code already exists" });
    }
  }

  db.prepare(
    `UPDATE promos SET
       code = ?, description = ?, discount_type = ?, discount_value = ?, min_subtotal = ?,
       active = ?, start_date = ?, end_date = ?, max_uses = ?
     WHERE id = ?`
  ).run(
    newCode,
    description !== undefined ? description : existing.description,
    discount_type !== undefined ? discount_type : existing.discount_type,
    discount_value != null ? Number(discount_value) : existing.discount_value,
    min_subtotal != null ? Number(min_subtotal) : existing.min_subtotal,
    active !== undefined ? (active ? 1 : 0) : existing.active,
    start_date !== undefined ? start_date : existing.start_date,
    end_date !== undefined ? end_date : existing.end_date,
    max_uses !== undefined ? (max_uses != null ? Number(max_uses) : null) : existing.max_uses,
    req.params.id
  );

  res.json(db.prepare("SELECT * FROM promos WHERE id = ?").get(req.params.id));
});

router.delete("/:id", requireAuth, (req, res) => {
  const result = db.prepare("DELETE FROM promos WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Promo not found" });
  }
  res.json({ success: true });
});

module.exports = { router, checkPromo };
