const express = require("express");
const crypto = require("crypto");
const db = require("../db");
const loginLock = require("../lib/loginLock");
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

  const key = loginLock.clientKey(req);
  const locked = loginLock.checkLocked(key);
  if (locked > 0) {
    const mins = Math.ceil(locked / 60);
    return res.status(429).json({
      error: `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`
    });
  }

  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user || !verifyPassword(password, user.password_hash)) {
    loginLock.registerFailure(key);
    return res.status(401).json({ error: "Invalid username or password" });
  }

  loginLock.registerSuccess(key);
  const token = createSession(user);
  res.cookie("rt_token", token, { httpOnly: true, sameSite: "lax", maxAge: 12 * 60 * 60 * 1000 });
  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    mustChangePassword: !!user.must_change_password
  });
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
  if (String(next).length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }
  if (current === next) {
    return res.status(400).json({ error: "New password must be different from the current password" });
  }
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.userId);
  if (!verifyPassword(current, user.password_hash)) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = require("../lib/auth").hashPassword(next, salt);
  db.prepare("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?").run(
    `${salt}:${hash}`,
    req.user.userId
  );
  req.user.mustChangePassword = false;
  res.json({ success: true });
});

module.exports = router;
