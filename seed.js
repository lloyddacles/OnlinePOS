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

const seedMeals = [
  { name: "Turones", category: "Meals", price: 45, description: "Crispy fried banana lumpia with caramelized sugar." },
  { name: "Cheesestick", category: "Meals", price: 45, description: "Golden fried cheese sticks, served with dipping sauce." },
  { name: "Pork Shanghai", category: "Meals", price: 60, description: "Classic lumpiang shanghai with sweet chili dip." },
  { name: "Carbonara", category: "Meals", price: 95, description: "Creamy pasta carbonara with bacon and parmesan." },
  { name: "Spaghetti", category: "Meals", price: 85, description: "Filipino-style spaghetti with sweet meat sauce." },
  { name: "Tuna Pesto", category: "Meals", price: 95, description: "Pasta tossed in basil pesto with flaked tuna." },
  { name: "Club House", category: "Meals", price: 110, description: "Triple-decker sandwich with chicken, egg and bacon." },
  { name: "Cheesy Burger", category: "Meals", price: 70, description: "Beef patty loaded with melted cheese." },
  { name: "Payumi Burger", category: "Meals", price: 85, description: "House specialty burger with a savory sauce." },
  { name: "Zaida Burger", category: "Meals", price: 85, description: "Signature burger with house dressing." },
  { name: "Kani Salad", category: "Meals", price: 90, description: "Crabstick salad with creamy dressing." },
  { name: "Chicken Wings", category: "Chicken Wings", price: 0, description: "Pick your size and flavor." }
];

const seedWingAddons = [
  { name: "4 pcs", type: "size", price: 95, sort_order: 0, category: "Chicken Wings", required: 1 },
  { name: "6 pcs", type: "size", price: 145, sort_order: 1, category: "Chicken Wings", required: 1 },
  { name: "10 pcs", type: "size", price: 225, sort_order: 2, category: "Chicken Wings", required: 1 },
  { name: "16 pcs", type: "size", price: 340, sort_order: 3, category: "Chicken Wings", required: 1 },
  { name: "30 pcs", type: "size", price: 600, sort_order: 4, category: "Chicken Wings", required: 1 },

  { name: "Spicy", type: "flavor", price: 0, sort_order: 0, category: "Chicken Wings", required: 1 },
  { name: "Non-Spicy", type: "flavor", price: 0, sort_order: 1, category: "Chicken Wings", required: 1 }
];

function seedMissingProducts() {
  const existing = new Set(db.prepare("SELECT name FROM products").all().map((r) => r.name));
  const missing = seedMeals.filter((p) => !existing.has(p.name));
  if (missing.length === 0) {
    console.log("Meal items already present. Skipping.");
    return;
  }
  const insert = db.prepare(
    "INSERT INTO products (name, category, price, description, available, is_drink) VALUES (@name, @category, @price, @description, 1, 0)"
  );
  const runAll = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });
  runAll(missing);
  console.log(`Seeded ${missing.length} meal items.`);
}

function seedWingAddonsData() {
  const existing = new Set(db.prepare("SELECT name FROM addons").all().map((r) => r.name));
  const missing = seedWingAddons.filter((a) => !existing.has(a.name));
  if (missing.length === 0) {
    console.log("Wing add-ons already present. Skipping.");
    return;
  }
  const insert = db.prepare(
    `INSERT INTO addons (name, type, price, sort_order, available, category, required)
     VALUES (@name, @type, @price, @sort_order, 1, @category, @required)`
  );
  const runAll = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });
  runAll(missing);
  console.log(`Seeded ${missing.length} wing add-on options.`);
}

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

const seedPromos = [
  {
    code: "NEWBIE10",
    description: "10% off your first order",
    discount_type: "percent",
    discount_value: 10,
    min_subtotal: 0
  },
  {
    code: "SUMMER50",
    description: "₱50 off orders over ₱200",
    discount_type: "amount",
    discount_value: 50,
    min_subtotal: 200
  },
  {
    code: "PAYDAY20",
    description: "20% off this weekend only",
    discount_type: "percent",
    discount_value: 20,
    min_subtotal: 100
  }
];

function seedPromosData() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM promos").get().count;
  if (count > 0) {
    console.log("Promos already seeded. Skipping.");
    return;
  }
  const insert = db.prepare(
    `INSERT INTO promos (code, description, discount_type, discount_value, min_subtotal, active)
     VALUES (@code, @description, @discount_type, @discount_value, @min_subtotal, 1)`
  );
  const runAll = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });
  runAll(seedPromos);
  console.log(`Seeded ${seedPromos.length} sample promos.`);
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
seedPromosData();
seedMissingProducts();
seedWingAddonsData();
