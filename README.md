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

> ⚠️ **Change the default password immediately after your first login** in the Admin Panel → Settings.

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

The fastest way to let clients access the system is a **Cloudflare Quick Tunnel** — no domain, no card, no account required:

```bash
bash deploy/tunnel.sh
```

The script starts the local server (if not running) and prints a public HTTPS link (e.g. `https://xxxx.trycloudflare.com`) that you can share with clients immediately.

> **Note:** Quick tunnel URLs change every time the tunnel restarts, and your computer must stay on. For a permanent URL, use a Cloudflare **named tunnel** with your own domain, or deploy the app to an always-on cloud host using `deploy/setup.sh` (Oracle Cloud Free Tier, Render, or Fly.io).

---

## 📂 Project Structure

```
OnlinePOS/
├── server.js          # Express entry point (port 3000)
├── db.js              # SQLite schema + migrations
├── seed.js            # Seeds products, add-ons, promos, admin user
├── routes/            # API route handlers (orders, products, stats, ...)
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
