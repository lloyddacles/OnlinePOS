const express = require("express");
const db = require("../db");
const {
  verifyPassword,
  createSession,
  destroySession,
  getSession,
  requireAuth
} = require("../lib/auth");

const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = createSession(user);
  res.cookie("rt_token", token, { httpOnly: true, sameSite: "lax", maxAge: 12 * 60 * 60 * 1000 });
  res.json({ id: user.id, username: user.username, role: user.role });
});

router.post("/logout", (req, res) => {
  destroySession(req);
  res.clearCookie("rt_token");
  res.json({ success: true });
});

router.get("/me", (req, res) => {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json({ username: session.username, role: session.role });
});

router.post("/change-password", requireAuth, (req, res) => {
  const { current, next } = req.body;
  if (!current || !next) {
    return res.status(400).json({ error: "Current and new password are required" });
  }
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.userId);
  if (!verifyPassword(current, user.password_hash)) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }
  const salt = require("crypto").randomBytes(16).toString("hex");
  const hash = require("../lib/auth").hashPassword(next, salt);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
    `${salt}:${hash}`,
    req.user.userId
  );
  res.json({ success: true });
});

module.exports = router;
