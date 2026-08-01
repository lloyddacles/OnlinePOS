const express = require("express");
const path = require("path");
const fs = require("fs");
const os = require("os");
const db = require("../db");
const { requireAuth } = require("../lib/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const backupPath = path.join(os.tmpdir(), `pos-backup-${Date.now()}.db`);
  try {
    await db.backup(backupPath);
  } catch (err) {
    fs.unlink(backupPath, () => {});
    return res.status(500).json({ error: "Backup failed: " + err.message });
  }
  const stamp = new Date().toISOString().slice(0, 10);
  res.download(backupPath, `rocks-teas-pos-backup-${stamp}.db`, () => {
    fs.unlink(backupPath, () => {});
  });
});

module.exports = router;
