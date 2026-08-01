const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, "pos.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT DEFAULT '',
    barcode TEXT DEFAULT '',
    available INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT DEFAULT '',
    items TEXT NOT NULL,
    subtotal REAL NOT NULL,
    discount REAL NOT NULL DEFAULT 0,
    discount_type TEXT NOT NULL DEFAULT 'none',
    tax REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'Cash',
    amount_tendered REAL NOT NULL DEFAULT 0,
    change_due REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Completed',
    void_reason TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS addons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('sweetness', 'ice', 'topping')),
    price REAL NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    available INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'cashier',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

ensureColumn("products", "barcode", "TEXT DEFAULT ''");
ensureColumn("orders", "discount_type", "TEXT NOT NULL DEFAULT 'none'");
ensureColumn("orders", "void_reason", "TEXT DEFAULT ''");

const DEFAULTS = {
  store_name: "Rocks and Teas",
  store_address: "123 Milk Tea St., Quezon City",
  store_phone: "",
  tax_rate: "12",
  receipt_footer: "Thank you! Come again!"
};

const setDefault = db.prepare(
  "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
);
for (const [key, value] of Object.entries(DEFAULTS)) {
  setDefault.run(key, value);
}

module.exports = db;
