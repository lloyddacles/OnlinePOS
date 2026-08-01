const crypto = require("crypto");
const db = require("./db");

const seedProducts = [
  // Milk Tea
  { name: "Classic Milk Tea", category: "Milk Tea", price: 59, description: "Signature black tea with creamy milk, the original favorite." },
  { name: "Okinawa Milk Tea", category: "Milk Tea", price: 69, description: "Brown sugar sweetness over smooth black milk tea." },
  { name: "Wintermelon Milk Tea", category: "Milk Tea", price: 65, description: "Light, sweet wintermelon blended with rich milk tea." },
  { name: "Taro Milk Tea", category: "Milk Tea", price: 69, description: "Creamy purple taro with chewy pearls." },
  { name: "Matcha Milk Tea", category: "Milk Tea", price: 79, description: "Premium Japanese matcha with fresh milk." },
  { name: "Hokkaido Milk Tea", category: "Milk Tea", price: 69, description: "Caramel-forward milk tea inspired by Hokkaido." },
  { name: "Brown Sugar Milk Tea", category: "Milk Tea", price: 89, description: "Rich brown sugar syrup with fresh milk and pearls." },
  { name: "Thai Milk Tea", category: "Milk Tea", price: 79, description: "Bold Thai tea with a hint of spice and creamy milk." },

  // Frappe
  { name: "Cookies & Cream Frappe", category: "Frappe", price: 89, description: "Blended ice with chocolate cookies and cream." },
  { name: "Caramel Frappe", category: "Frappe", price: 89, description: "Smooth caramel blended drink topped with cream." },
  { name: "Mocha Frappe", category: "Frappe", price: 89, description: "Chocolate and coffee blended with milk and ice." },
  { name: "Vanilla Frappe", category: "Frappe", price: 85, description: "Classic sweet vanilla blended frappe." },
  { name: "Matcha Frappe", category: "Frappe", price: 95, description: "Green matcha blended with creamy milk and ice." },
  { name: "Taro Frappe", category: "Frappe", price: 89, description: "Frosty taro blended drink, thick and creamy." },

  // Rock Salt & Cheese
  { name: "Rock Salt & Cheese Milk Tea", category: "Rock Salt & Cheese", price: 99, description: "Signature milk tea topped with salty cheese foam." },
  { name: "Rock Salt & Cheese Coffee", category: "Rock Salt & Cheese", price: 99, description: "Bold iced coffee under a layer of salted cheese foam." },
  { name: "Rock Salt & Cheese Chocolate", category: "Rock Salt & Cheese", price: 99, description: "Rich chocolate topped with savory rock salt cheese." },
  { name: "Rock Salt & Cheese Matcha", category: "Rock Salt & Cheese", price: 105, description: "Earthy matcha crowned with creamy cheese foam." },

  // Fruit Tea
  { name: "Lemon Fruit Tea", category: "Fruit Tea", price: 75, description: "Zesty lemon over chilled fruit tea." },
  { name: "Passion Fruit Tea", category: "Fruit Tea", price: 79, description: "Tropical passion fruit in refreshing iced tea." },
  { name: "Strawberry Fruit Tea", category: "Fruit Tea", price: 79, description: "Sweet strawberry infusion with real fruit bits." },
  { name: "Peach Fruit Tea", category: "Fruit Tea", price: 79, description: "Juicy peach notes blended into cool fruit tea." },
  { name: "Mango Fruit Tea", category: "Fruit Tea", price: 79, description: "Sunny mango sweetness over iced tea." },
  { name: "Blueberry Fruit Tea", category: "Fruit Tea", price: 79, description: "Berry-forward fruit tea with a deep blue hue." },

  // Yakult
  { name: "Yakult Original", category: "Yakult", price: 59, description: "Classic probiotic yakult drink over ice." },
  { name: "Yakult Lemon", category: "Yakult", price: 69, description: "Probiotic yakult with a splash of lemon." },
  { name: "Yakult Strawberry", category: "Yakult", price: 69, description: "Yakult blended with sweet strawberry." },
  { name: "Yakult Passion Fruit", category: "Yakult", price: 69, description: "Tart passion fruit meets creamy yakult." },

  // Oreo
  { name: "Oreo Milk Tea", category: "Oreo", price: 89, description: "Milk tea loaded with crushed Oreo cookies." },
  { name: "Oreo Cheesecake", category: "Oreo", price: 95, description: "Oreo cheesecake blended into a rich drink." },
  { name: "Oreo Frappe", category: "Oreo", price: 95, description: "Blended ice, chocolate cookie crumbs and cream." },

  // Cheesecake
  { name: "Classic Cheesecake", category: "Cheesecake", price: 89, description: "Creamy classic cheesecake in a glass." },
  { name: "Matcha Cheesecake", category: "Cheesecake", price: 95, description: "Creamy cheesecake with a matcha twist." },
  { name: "Oreo Cheesecake", category: "Cheesecake", price: 95, description: "Cookies and cream cheesecake smoothie." },
  { name: "Strawberry Cheesecake", category: "Cheesecake", price: 95, description: "Sweet strawberry swirled into cheesecake." },
  { name: "Blueberry Cheesecake", category: "Cheesecake", price: 95, description: "Blueberry-topped creamy cheesecake drink." },

  // Detox Drinks
  { name: "Lemon Detox", category: "Detox Drinks", price: 69, description: "Refreshing lemon water cleanse." },
  { name: "Cucumber Detox", category: "Detox Drinks", price: 69, description: "Cool cucumber infused detox drink." },
  { name: "Ginger Lemon Detox", category: "Detox Drinks", price: 69, description: "Warming ginger and lemon wellness drink." },
  { name: "Honey Cucumber Lemon", category: "Detox Drinks", price: 75, description: "Honey, cucumber and lemon hydration blend." }
];

const seedAddons = [
  { name: "No Sugar (0%)", type: "sweetness", price: 0, sort_order: 0 },
  { name: "Less Sugar (25%)", type: "sweetness", price: 0, sort_order: 1 },
  { name: "Regular (50%)", type: "sweetness", price: 0, sort_order: 2 },
  { name: "Less Sweet (75%)", type: "sweetness", price: 0, sort_order: 3 },
  { name: "Extra Sweet (100%)", type: "sweetness", price: 0, sort_order: 4 },

  { name: "No Ice", type: "ice", price: 0, sort_order: 0 },
  { name: "Less Ice", type: "ice", price: 0, sort_order: 1 },
  { name: "Regular Ice", type: "ice", price: 0, sort_order: 2 },
  { name: "Extra Ice", type: "ice", price: 0, sort_order: 3 },

  { name: "Pearls", type: "topping", price: 10, sort_order: 0 },
  { name: "Pudding", type: "topping", price: 15, sort_order: 1 },
  { name: "Grass Jelly", type: "topping", price: 10, sort_order: 2 },
  { name: "Nata de Coco", type: "topping", price: 10, sort_order: 3 },
  { name: "Cheese Foam", type: "topping", price: 20, sort_order: 4 },
  { name: "Oreo Crumbs", type: "topping", price: 15, sort_order: 5 },
  { name: "Coffee Jelly", type: "topping", price: 10, sort_order: 6 }
];

function seedIfEmpty(table, rows, mapFn, label) {
  const count = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
  if (count > 0) {
    console.log(`${label} already seeded. Skipping.`);
    return;
  }
  const insert = db.prepare(mapFn);
  const runAll = db.transaction((data) => {
    for (const row of data) insert.run(row);
  });
  runAll(rows);
  console.log(`Seeded ${rows.length} ${label}.`);
}

function seedAdminUser() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  if (count > 0) return;
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync("admin123", salt, 100000, 64, "sha512")
    .toString("hex");
  db.prepare(
    "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')"
  ).run("admin", `${salt}:${hash}`);
  console.log("Seeded admin user (admin / admin123).");
}

seedIfEmpty(
  "products",
  seedProducts,
  "INSERT INTO products (name, category, price, description, available) VALUES (@name, @category, @price, @description, 1)",
  "products"
);

seedIfEmpty(
  "addons",
  seedAddons,
  "INSERT INTO addons (name, type, price, sort_order, available) VALUES (@name, @type, @price, @sort_order, 1)",
  "addon options"
);

seedAdminUser();
