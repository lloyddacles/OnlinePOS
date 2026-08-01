# 🧋 Rocks and Teas Online POS

A complete, web-based Point of Sale (POS) system built for **Rocks and Teas** — designed to run the day-to-day selling of milk tea, frappes, fruit teas, meals, and chicken wings in a single, easy-to-use system.

> **Author:** Mr. Lloyd Christopher F. Dacles, MIS, CITSMP, DBMP, CPAA, ITPO, CDSA

---

## ⚠️ Ownership & Usage Notice (Please Read)

**This software is the exclusive intellectual property of Mr. Lloyd Christopher F. Dacles.**

It is **protected by copyright law and related intellectual property rights (IPR)**. You are **NOT permitted** to:

- Copy, reproduce, duplicate, or plagiarize this software, in whole or in part;
- Reuse, redistribute, or resell it as your own work;
- Modify, reverse-engineer, or derive new works from it;
- Use it for any commercial or personal purpose, in any form, on any platform.

**Using this software without the written permission of the author is strictly prohibited and may result in legal action.**

If you wish to use, license, or adapt this system — for a business, a client, or a personal project — please contact the author first to obtain **written permission**.

---

## ✨ Features

### Customer-Facing POS
- Fast, touch-friendly ordering screen
- Browse drinks by category: Milk Tea, Frappe, Rock Salt & Cheese, Fruit Tea, Yakult, Oreo, Cheesecake, Detox Drinks
- Full customization: **sugar level**, **ice level**, and **toppings** (Pearls, Pudding, Grass Jelly, Nata de Coco, Cheese Foam, Oreo Crumbs, Coffee Jelly)
- **Meals & snacks**: Turones, Cheesestick, Pork Shanghai, Carbonara, Spaghetti, Tuna Pesto, Club House, Burgers, Kani Salad, and more
- **Chicken Wings**: pick your size (4/6/10/16/30 pcs) and flavor (Spicy / Non-Spicy)
- Live order cart with automatic price calculation

### Kitchen / Queue Screen
- Live display of incoming orders so staff can prepare drinks in real time
- Order status tracking from *received* to *completed*

### Admin Panel
- Manage products, categories, add-ons, and availability
- Manage **promo codes** (percentage or fixed-amount discounts)
- Change account password and store settings

### Reports & Analytics
- Daily, weekly, and monthly sales reports
- Top-selling products and categories
- Order history and full transaction log
- Real-time dashboard statistics

### Security
- Password-protected admin login (hashed + salted passwords)
- **Forced password change on first login** — the default `admin/admin123` credentials must be replaced before the dashboard can be used
- **Brute-force protection** — the account locks for 15 minutes after 5 failed login attempts
- Separate access control for protected pages

---

## 🛠️ Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Backend    | Node.js + Express                 |
| Database   | SQLite (better-sqlite3)           |
| Frontend   | HTML, CSS, Vanilla JavaScript     |
| Deployment | Cloudflare Tunnel (local) / Oracle Cloud / Render / Fly.io |

Everything runs in a single Node.js process with a file-based database — no external services required.

---

## 📦 Getting Started

### Requirements
- [Node.js](https://nodejs.org) **v18 or newer** (Node 20 recommended)

### Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start
```

Then open your browser:

```
http://localhost:3000
```

### Default Login

| Role  | Username | Password   |
|-------|----------|------------|
| Admin | `admin`  | `admin123` |

> ⚠️ **A password change is required on your very first login.** After signing in with the default credentials, you'll be directed to set your own password before you can use the system.

---

## 📄 Pages & Routes

| Page                  | URL                | Access     |
|-----------------------|--------------------|------------|
| POS (ordering screen) | `/`                | Public     |
| Login                 | `/login`           | Public     |
| Queue / Kitchen       | `/queue`           | Admin      |
| Admin Panel           | `/admin`           | Admin      |
| Reports               | `/reports`         | Admin      |
| Health check          | `/api/health`      | Public     |

---

## 🗄️ Data & Storage

- All data is stored in a single SQLite file: `data/pos.db`
- The database is **auto-seeded on first run** with:
  - **52 products** (40 drinks + 11 meals + 1 chicken wings)
  - **23 add-on options** (sugar, ice, toppings, wing sizes, wing flavors)
  - **3 sample promo codes** (`NEWBIE10`, `SUMMER50`, `PAYDAY20`)
  - **1 admin user** (`admin` / `admin123`)
- The database file and `node_modules` are excluded from the repository (see `.gitignore`), so each fresh deployment seeds a clean database automatically.

---

## 🌐 Going Online (Client Access)

### Option A — Always-on hosting with Render (recommended, free)
Deploy from this GitHub repo to **Render.com** so clients can use the POS even when your computer is off. Uses the included `render.yaml` blueprint — no credit card needed for the free plan.

1. Push this repo to GitHub, then go to **render.com** and sign up (email only).
2. Click **New → Blueprint** and connect your GitHub account.
3. Pick the **OnlinePOS** repo → Render reads `render.yaml` and creates the service.
4. Click **Apply** and wait ~5 minutes for the first build.
5. Once **Live**, your public link is `https://rocks-and-teas-pos.onrender.com`.

> **Free-tier notes:** the app pauses after ~15 min with no visitors and wakes on the next visit (~15 s delay). The database lives on temporary storage, so it **resets when you redeploy** — always **Download database backup** from the Admin → Settings panel before deploying a new version, or enable automatic GitHub backups (see below).

### Automatic backups (optional, recommended)
The app can push a daily backup of the database to a private GitHub repo. Set two environment variables in Render (Service → Environment):
- `GITHUB_TOKEN` — a GitHub personal access token with `Contents: Read/Write` on a backup repo
- `GITHUB_REPO` — e.g. `yourusername/pos-backups`

You can also download a full backup any time from **Admin → Settings → Data Backup**.

### Option B — Cloudflare Quick Tunnel (local, quick)
The fastest way to share the system from your own computer — no domain, no card, no account:

```bash
bash deploy/tunnel.sh
```

This starts the server (if not running) and prints a public HTTPS link to share with clients. **Note:** quick tunnel URLs change on every restart and your computer must stay on.

### Option C — Ubuntu VPS
Use `deploy/setup.sh` on any Ubuntu server (e.g. Oracle Cloud Free Tier) for a self-managed always-on deployment.

---

## 📂 Project Structure

```
OnlinePOS/
├── server.js          # Express entry point (port 3000)
├── db.js              # SQLite schema + migrations
├── seed.js            # Seeds products, add-ons, promos, admin user
├── render.yaml        # Render.com blueprint for always-on hosting
├── routes/            # API route handlers (orders, products, stats, backup, ...)
├── lib/               # Auth, login lockout, GitHub auto-backup
├── public/            # Frontend pages and assets
│   ├── index.html     # POS ordering screen
│   ├── admin.html     # Admin panel
│   ├── queue.html     # Kitchen queue screen
│   ├── reports.html   # Sales reports
│   └── login.html     # Login page
├── deploy/
│   ├── setup.sh       # One-shot Ubuntu server setup (Node + PM2)
│   └── tunnel.sh      # Cloudflare quick-tunnel launcher
└── data/              # SQLite database (auto-created, not committed)
```

---

## 📝 License

**All Rights Reserved.** This software is proprietary and owned by **Mr. Lloyd Christopher F. Dacles, MIS, CITSMP, DBMP, CPAA, ITPO, CDSA**.

No part of this software may be copied, reproduced, modified, distributed, or used without the author's **written permission**. Plagiarism, unauthorized copying, or reuse of any part of this project is strictly prohibited and enforceable by law.

For licensing inquiries or permissions, please contact the author directly.

---

© 2026 Mr. Lloyd Christopher F. Dacles, MIS, CITSMP, DBMP, CPAA, ITPO, CDSA. All rights reserved.
