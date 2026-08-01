const path = require("path");
const express = require("express");
const { getSession } = require("./lib/auth");

require("./seed");

const productsRouter = require("./routes/products");
const ordersRouter = require("./routes/orders");
const statsRouter = require("./routes/stats");
const addonsRouter = require("./routes/addons");
const authRouter = require("./routes/auth");
const settingsRouter = require("./routes/settings");
const reportsRouter = require("./routes/reports");
const promosRouter = require("./routes/promos");
const backupRouter = require("./routes/backup");
const { pushBackup } = require("./lib/githubBackup");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const protectedPages = {
  "/admin": "admin.html",
  "/queue": "queue.html",
  "/reports": "reports.html"
};

for (const [route, file] of Object.entries(protectedPages)) {
  app.get(route, (req, res) => {
    const session = getSession(req);
    if (!session) {
      return res.redirect("/login");
    }
    if (session.mustChangePassword) {
      return res.redirect("/change-password");
    }
    res.sendFile(path.join(__dirname, "public", file));
  });
}

app.get("/change-password", (req, res) => {
  const session = getSession(req);
  if (!session) {
    return res.redirect("/login");
  }
  if (!session.mustChangePassword) {
    return res.redirect("/");
  }
  res.sendFile(path.join(__dirname, "public", "change-password.html"));
});

app.get("/login", (req, res) => {
  const session = getSession(req);
  if (session) {
    return res.redirect(session.mustChangePassword ? "/change-password" : "/");
  }
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/api/auth/me", (req, res) => {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json({ username: session.username, role: session.role });
});

app.get("/api/health", (req, res) => {
  const db = require("./db");
  const ok = db.prepare("SELECT 1 AS ok").get();
  res.json({ ok: ok.ok === 1, uptime: process.uptime() });
});

app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/stats", statsRouter);
app.use("/api/addons", addonsRouter);
app.use("/api/auth", authRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/promos", promosRouter.router);
app.use("/api/backup", backupRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Rocks and Teas POS running at http://localhost:${PORT}`);
});

const DAY_MS = 24 * 60 * 60 * 1000;
if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
  const runBackup = () =>
    pushBackup()
      .then((r) => console.log(`[backup] ${r.ok ? "pushed to GitHub" : "failed: " + r.status}`))
      .catch((err) => console.error("[backup] error:", err.message));
  setTimeout(runBackup, 60 * 1000);
  setInterval(runBackup, DAY_MS);
  console.log("Automatic daily backup to GitHub enabled.");
}
