const MAX_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;
const lockout = new Map();

function clientKey(req) {
  const ip = req.headers["cf-connecting-ip"] || req.ip || "unknown";
  const user = req.body && req.body.username ? String(req.body.username).toLowerCase() : "?";
  return `${ip}:${user}`;
}

function checkLocked(key) {
  const rec = lockout.get(key);
  if (!rec) return 0;
  const remaining = rec.lockedUntil - Date.now();
  if (remaining > 0) return Math.ceil(remaining / 1000);
  if (Date.now() - rec.windowStart > LOCK_WINDOW_MS) lockout.delete(key);
  return 0;
}

function registerFailure(key) {
  const now = Date.now();
  const rec = lockout.get(key) || { fails: 0, windowStart: now, lockedUntil: 0 };
  if (rec.lockedUntil > now) return;
  if (now - rec.windowStart > LOCK_WINDOW_MS) {
    rec.fails = 0;
    rec.windowStart = now;
  }
  rec.fails += 1;
  if (rec.fails >= MAX_ATTEMPTS) {
    rec.lockedUntil = now + LOCK_WINDOW_MS;
    rec.fails = 0;
  }
  lockout.set(key, rec);
}

function registerSuccess(key) {
  lockout.delete(key);
}

module.exports = { clientKey, checkLocked, registerFailure, registerSuccess };
