const CATEGORY_EMOJI = {
  "Milk Tea": "🥤",
  "Frappe": "🍧",
  "Rock Salt & Cheese": "🧂",
  "Fruit Tea": "🍹",
  "Yakult": "🍼",
  "Oreo": "🍪",
  "Cheesecake": "🍰",
  "Detox Drinks": "🥒"
};

const ADDON_TYPE_LABEL = {
  sweetness: "Sweetness",
  ice: "Ice Level",
  topping: "Toppings"
};

const state = {
  products: [],
  addons: [],
  settings: {},
  categories: [],
  activeCategory: "All",
  search: "",
  cart: new Map(),
  cartIdCounter: 0,
  customProduct: null,
  customSelections: {},
  heldOrders: JSON.parse(localStorage.getItem("rt_held") || "[]")
};

function init() {
  loadAddons();
  loadCategories();
  loadProducts();
  loadSettings().then((s) => {
    state.settings = s;
    document.getElementById("taxRateLabel").textContent = s.tax_rate;
  });
  checkAuth();
  renderHeldBadge();
}

async function checkAuth() {
  try {
    const me = await api("/api/auth/me");
    const link = document.getElementById("logoutLink");
    link.style.display = "inline";
    link.textContent = `${me.username} · Logout`;
    link.onclick = (e) => {
      e.preventDefault();
      logout();
    };
  } catch (err) {
    /* not logged in — POS still usable for order taking */
  }
}

async function loadAddons() {
  try {
    state.addons = await api("/api/addons");
  } catch (err) {
    state.addons = [];
  }
}

async function loadCategories() {
  const res = await fetch("/api/products/categories");
  state.categories = await res.json();
  renderCategoryTabs();
}

async function loadProducts() {
  const res = await fetch("/api/products");
  state.products = await res.json();
  renderProducts();
}

function renderCategoryTabs() {
  const tabs = document.getElementById("categoryTabs");
  const all = ["All", ...state.categories];
  tabs.innerHTML = all
    .map(
      (cat) =>
        `<button data-cat="${cat}" class="${cat === state.activeCategory ? "active" : ""}">${cat}</button>`
    )
    .join("");

  tabs.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeCategory = btn.dataset.cat;
      renderCategoryTabs();
      renderProducts();
    });
  });
}

function renderProducts() {
  const grid = document.getElementById("productGrid");
  const query = state.search.toLowerCase();
  const filtered = state.products.filter((p) => {
    const matchesCategory = state.activeCategory === "All" || p.category === state.activeCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      (p.barcode && p.barcode.includes(query));
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="cart-empty" style="grid-column:1/-1;">No drinks found.</div>`;
    return;
  }

  grid.innerHTML = filtered
    .map((p) => {
      const emoji = CATEGORY_EMOJI[p.category] || "🥤";
      return `
        <div class="product-card ${p.available ? "" : "unavailable"}" data-id="${p.id}">
          <div class="emoji">${emoji}</div>
          <div class="name">${p.name}</div>
          <div class="category">${p.category}</div>
          <div class="price">${fmt(p.price)}</div>
          <div class="add-hint">+</div>
        </div>`;
    })
    .join("");

  grid.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", () => {
      const product = state.products.find((p) => p.id === Number(card.dataset.id));
      if (!product || !product.available) return;
      openCustomize(product);
    });
  });
}

// ---- Customization ----
function openCustomize(product) {
  state.customProduct = product;
  state.customSelections = {
    sweetness: null,
    ice: null,
    toppings: []
  };

  document.getElementById("customTitle").textContent = product.name;
  document.getElementById("customSub").textContent = `${product.category} · ${fmt(product.price)}`;

  const sections = document.getElementById("customSections");
  const hasCustom = state.addons.filter((a) => a.available);
  sections.innerHTML = Object.keys(ADDON_TYPE_LABEL)
    .filter((type) => hasCustom.some((a) => a.type === type))
    .map((type) => {
      const options = hasCustom.filter((a) => a.type === type);
      if (options.length === 0) return "";
      const multi = type === "topping";
      return `
        <div class="addon-section">
          <h4>${ADDON_TYPE_LABEL[type]}${multi ? " (extra ₱)" : ""}</h4>
          <div class="addon-options" data-type="${type}">
            ${options
              .map(
                (a) =>
                  `<button class="addon-option" data-id="${a.id}" data-price="${a.price}">${a.name}${
                    a.price ? ` +${a.price}` : ""
                  }</button>`
              )
              .join("")}
          </div>
        </div>`;
    })
    .join("");

  sections.querySelectorAll(".addon-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.closest(".addon-options").dataset.type;
      const id = Number(btn.dataset.id);
      if (type === "topping") {
        const idx = state.customSelections.toppings.indexOf(id);
        if (idx === -1) {
          state.customSelections.toppings.push(id);
          btn.classList.add("selected");
        } else {
          state.customSelections.toppings.splice(idx, 1);
          btn.classList.remove("selected");
        }
      } else {
        state.customSelections[type] = id;
        btn.parentElement.querySelectorAll(".addon-option").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
      }
    });
  });

  document.getElementById("customModal").classList.add("open");
}

function addCustomToCart() {
  const product = state.customProduct;
  const addons = [];
  for (const [type, selection] of Object.entries(state.customSelections)) {
    if (type === "toppings") {
      for (const id of selection) {
        const addon = state.addons.find((a) => a.id === id);
        if (addon) addons.push({ id: addon.id, name: addon.name, price: addon.price });
      }
    } else if (selection) {
      const addon = state.addons.find((a) => a.id === selection);
      if (addon) addons.push({ id: addon.id, name: addon.name, price: addon.price });
    }
  }

  const linePrice = product.price + addons.reduce((s, a) => s + a.price, 0);

  for (const item of state.cart.values()) {
    if (item.product_id === product.id && sameAddons(item.addons, addons)) {
      item.quantity += 1;
      document.getElementById("customModal").classList.remove("open");
      renderCart();
      return;
    }
  }

  state.cartIdCounter += 1;
  state.cart.set(`cart-${state.cartIdCounter}`, {
    product_id: product.id,
    name: product.name,
    price: product.price,
    unit_price: linePrice,
    quantity: 1,
    addons
  });
  document.getElementById("customModal").classList.remove("open");
  renderCart();
}

function sameAddons(a, b) {
  if (a.length !== b.length) return false;
  const keyA = a.map((x) => `${x.id}`).sort().join(",");
  const keyB = b.map((x) => `${x.id}`).sort().join(",");
  return keyA === keyB;
}

function changeQty(key, delta) {
  const item = state.cart.get(key);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart.delete(key);
  }
  renderCart();
}

function lineTotal(item) {
  return item.unit_price * item.quantity;
}

function renderCart() {
  const container = document.getElementById("cartItems");
  const items = [...state.cart.values()];

  if (items.length === 0) {
    container.innerHTML = `<div class="cart-empty">Your cart is empty.<br />Tap a drink to add it.</div>`;
  } else {
    container.innerHTML = items
      .map((item, idx) => {
        const key = [...state.cart.keys()][idx];
        const addonsLabel =
          item.addons.length > 0
            ? `<div style="font-size:11px;color:var(--muted);">${item.addons
                .map((a) => a.name)
                .join(", ")}</div>`
            : "";
        return `
          <div class="cart-item">
            <div>
              <div class="item-name">${item.name}</div>
              ${addonsLabel}
            </div>
            <div class="qty-control">
              <button data-key="${key}" data-delta="-1">−</button>
              <span class="qty">${item.quantity}</span>
              <button data-key="${key}" data-delta="1">+</button>
            </div>
            <div class="item-price">${fmt(lineTotal(item))}</div>
          </div>`;
      })
      .join("");
  }

  container.querySelectorAll("button[data-delta]").forEach((btn) => {
    btn.addEventListener("click", () => {
      changeQty(btn.dataset.key, Number(btn.dataset.delta));
    });
  });

  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const taxRate = Number(state.settings.tax_rate) / 100;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  document.getElementById("cartCount").textContent = items.length;
  document.getElementById("subtotal").textContent = fmt(subtotal);
  document.getElementById("tax").textContent = fmt(tax);
  document.getElementById("total").textContent = fmt(total);
  document.getElementById("checkoutBtn").disabled = items.length === 0;
}

function clearCart() {
  state.cart.clear();
  renderCart();
}

// ---- Hold orders ----
function holdOrder() {
  if (state.cart.size === 0) return;
  const items = [...state.cart.values()].map((item) => ({
    product_id: item.product_id,
    name: item.name,
    price: item.price,
    unit_price: item.unit_price,
    quantity: item.quantity,
    addons: item.addons
  }));
  state.heldOrders.push({ heldAt: new Date().toISOString(), items });
  saveHeld();
  clearCart();
  showToast("Order held");
}

function saveHeld() {
  localStorage.setItem("rt_held", JSON.stringify(state.heldOrders));
  renderHeldBadge();
}

function renderHeldBadge() {
  const btn = document.getElementById("heldBtn");
  btn.style.display = state.heldOrders.length ? "inline-block" : "none";
  document.getElementById("heldCount").textContent = state.heldOrders.length;
}

function openHeld() {
  const list = document.getElementById("heldList");
  if (state.heldOrders.length === 0) {
    list.innerHTML = `<div class="cart-empty">No held orders.</div>`;
  } else {
    list.innerHTML = state.heldOrders
      .map((held, idx) => {
        const count = held.items.reduce((s, i) => s + i.quantity, 0);
        const total = held.items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
        return `
          <div class="held-item">
            <div class="held-meta">
              <strong>${new Date(held.heldAt).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })} · ${count} items</strong>
              <span>${held.items.map((i) => i.name).join(", ")}</span>
            </div>
            <div style="font-weight:800;">${fmt(total)}</div>
            <div style="display:flex;gap:4px;">
              <button class="icon-btn" data-restore="${idx}" title="Restore">↩️</button>
              <button class="icon-btn danger" data-discard="${idx}" title="Discard">✕</button>
            </div>
          </div>`;
      })
      .join("");
  }

  list.querySelectorAll("[data-restore]").forEach((btn) => {
    btn.addEventListener("click", () => restoreHeld(Number(btn.dataset.restore)));
  });
  list.querySelectorAll("[data-discard]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.heldOrders.splice(Number(btn.dataset.discard), 1);
      saveHeld();
      openHeld();
    });
  });

  document.getElementById("heldModal").classList.add("open");
}

function restoreHeld(idx) {
  const held = state.heldOrders[idx];
  if (!held) return;
  for (const item of held.items) {
    state.cartIdCounter += 1;
    state.cart.set(`cart-${state.cartIdCounter}`, {
      product_id: item.product_id,
      name: item.name,
      price: item.price,
      unit_price: item.unit_price,
      quantity: item.quantity,
      addons: item.addons
    });
  }
  state.heldOrders.splice(idx, 1);
  saveHeld();
  document.getElementById("heldModal").classList.remove("open");
  renderCart();
  showToast("Order restored");
}

// ---- Barcode / search ----
function handleSearch(value) {
  const q = value.trim();
  const barcodeMatch = q.length >= 3 && state.products.find((p) => p.barcode && p.barcode === q);
  if (barcodeMatch && barcodeMatch.available) {
    state.search = "";
    document.getElementById("search").value = "";
    openCustomize(barcodeMatch);
    return;
  }
  state.search = q;
  renderProducts();
}

// ---- Checkout ----
function cartSubtotal() {
  return [...state.cart.values()].reduce((sum, item) => sum + lineTotal(item), 0);
}

function computeDiscount() {
  const subtotal = cartSubtotal();
  const senior = document.getElementById("seniorCheck").checked;
  const promo = document.getElementById("promoCheck").checked;

  if (senior) return { type: "senior", value: subtotal * 0.2, label: "Senior / PWD (20%)" };
  if (promo) {
    const promoType = document.getElementById("promoType").value;
    const raw = Number(document.getElementById("promoValue").value) || 0;
    if (promoType === "promo_pct") {
      const pct = Math.min(Math.max(raw, 0), 100);
      return { type: "promo_pct", value: (subtotal * pct) / 100, label: `Promo (${pct}%)` };
    }
    const amt = Math.min(Math.max(raw, 0), subtotal);
    return { type: "promo_amt", value: amt, label: `Promo (₱ ${amt})` };
  }
  return { type: "none", value: 0, label: "None" };
}

function getTotals() {
  const subtotal = cartSubtotal();
  const discount = computeDiscount();
  const taxRate = Number(state.settings.tax_rate) / 100;
  const taxable = subtotal - discount.value;
  const tax = taxable * taxRate;
  const total = taxable + tax;
  return { subtotal, tax, total, discount };
}

function openCheckout() {
  if (state.cart.size === 0) return;
  document.getElementById("customerName").value = "";
  document.getElementById("paymentMethod").value = "Cash";
  document.getElementById("amountTendered").value = "";
  document.getElementById("seniorCheck").checked = false;
  document.getElementById("promoCheck").checked = false;
  document.getElementById("promoValue").value = "";
  document.getElementById("changeBox").style.display = "none";
  updateTotals();
  renderQuickCash();
  handlePaymentChange();
  document.getElementById("checkoutModal").classList.add("open");
}

function updateTotals() {
  const totals = getTotals();
  document.getElementById("discountLine").style.display = totals.discount.value > 0 ? "flex" : "none";
  document.getElementById("discountLabel").textContent = totals.discount.label;
  document.getElementById("discountAmount").textContent = `- ${fmt(totals.discount.value)}`;
  updateChange();
}

function handlePaymentChange() {
  const method = document.getElementById("paymentMethod").value;
  document.getElementById("cashGroup").style.display = method === "Cash" ? "block" : "none";
  updateChange();
}

function updateChange() {
  const tendered = Number(document.getElementById("amountTendered").value) || 0;
  const total = getTotals().total;
  const change = tendered - total;
  const box = document.getElementById("changeBox");
  const isCash = document.getElementById("paymentMethod").value === "Cash";
  box.style.display = isCash && tendered > 0 ? "block" : "none";
  box.textContent = change >= 0 ? `Change: ${fmt(change)}` : `Insufficient: ${fmt(Math.abs(change))}`;
}

function renderQuickCash() {
  const total = getTotals().total;
  const quick = [
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 500) * 500,
    Math.ceil(total / 1000) * 1000
  ];
  const container = document.getElementById("quickCash");
  const values = [...new Set(quick.map((v) => Math.round(v * 100) / 100))].filter((v) => v >= total);
  container.innerHTML = values
    .map((v) => `<button data-v="${v}">${fmt(v)}</button>`)
    .join("");

  container.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("amountTendered").value = btn.dataset.v;
      updateChange();
    });
  });
}

async function confirmCheckout() {
  const paymentMethod = document.getElementById("paymentMethod").value;
  const customerName = document.getElementById("customerName").value.trim();
  const amountTendered = Number(document.getElementById("amountTendered").value) || 0;
  const totals = getTotals();

  if (paymentMethod === "Cash" && amountTendered < totals.total) {
    showToast("Tendered amount is insufficient");
    return;
  }

  const items = [...state.cart.values()].map((item) => ({
    product_id: item.product_id,
    quantity: item.quantity,
    addons: item.addons
  }));

  try {
    const order = await api("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        customer_name: customerName,
        payment_method: paymentMethod,
        amount_tendered: amountTendered,
        discount_type: totals.discount.type,
        discount_value: totals.discount.type === "promo_pct" ? Number(document.getElementById("promoValue").value) : totals.discount.value
      })
    });

    document.getElementById("checkoutModal").classList.remove("open");
    order.store_name = state.settings.store_name;
    order.store_address = state.settings.store_address;
    order.tax_rate = state.settings.tax_rate;
    order.receipt_footer = state.settings.receipt_footer;
    renderReceipt(order);
    document.getElementById("receiptQueueHint").textContent = `Order #${order.order_number} is now in the queue for pickup.`;
    document.getElementById("receiptModal").classList.add("open");
    clearCart();
  } catch (err) {
    showToast(err.message);
  }
}

function renderReceipt(order) {
  const receiptEl = document.getElementById("receipt");
  receiptEl.dataset.order = JSON.stringify(order);
  receiptEl.innerHTML = `
    <div class="r-header">
      <h3>${order.store_name.toUpperCase()}</h3>
      <div>${order.store_address || ""}</div>
      <div>${new Date().toLocaleString("en-PH")}</div>
      <div>Order #${order.order_number}</div>
      ${order.customer_name ? `<div>Customer: ${order.customer_name}</div>` : ""}
    </div>
    ${order.items
      .map(
        (item) => `
          <div class="r-row"><span>${item.quantity} x ${item.name}</span><span>${fmt(item.line_total)}</span></div>
          ${item.addons.map((a) => `<div class="r-row" style="color:var(--muted);font-size:12px;"><span>&nbsp;&nbsp;+ ${a.name}</span></div>`).join("")}
        `
      )
      .join("")}
    <div class="r-divider"></div>
    <div class="r-row"><span>Subtotal</span><span>${fmt(order.subtotal)}</span></div>
    ${order.discount > 0 ? `<div class="r-row" style="color:var(--danger);"><span>${order.discount_type === "senior" ? "Senior/PWD" : "Promo"}</span><span>-${fmt(order.discount)}</span></div>` : ""}
    <div class="r-row"><span>VAT (${state.settings.tax_rate}%)</span><span>${fmt(order.tax)}</span></div>
    <div class="r-row r-total"><span>TOTAL</span><span>${fmt(order.total)}</span></div>
    <div class="r-divider"></div>
    <div class="r-row"><span>${order.payment_method}</span><span>${fmt(order.amount_tendered)}</span></div>
    <div class="r-row"><span>Change</span><span>${fmt(order.change_due)}</span></div>
    <div style="text-align:center;margin-top:8px;">${order.receipt_footer} 🧋</div>
  `;
}

function wireEvents() {
  document.getElementById("search").addEventListener("input", (e) => handleSearch(e.target.value));

  document.getElementById("checkoutBtn").addEventListener("click", openCheckout);
  document.getElementById("clearBtn").addEventListener("click", () => {
    clearCart();
    showToast("Cart cleared");
  });

  document.getElementById("holdBtn").addEventListener("click", holdOrder);
  document.getElementById("heldBtn").addEventListener("click", openHeld);
  document.getElementById("closeHeld").addEventListener("click", () => {
    document.getElementById("heldModal").classList.remove("open");
  });

  document.getElementById("cancelCustom").addEventListener("click", () => {
    document.getElementById("customModal").classList.remove("open");
  });
  document.getElementById("addCustomBtn").addEventListener("click", addCustomToCart);

  document.getElementById("cancelCheckout").addEventListener("click", () => {
    document.getElementById("checkoutModal").classList.remove("open");
  });
  document.getElementById("confirmCheckout").addEventListener("click", confirmCheckout);

  document.getElementById("seniorCheck").addEventListener("change", () => {
    if (document.getElementById("seniorCheck").checked) {
      document.getElementById("promoCheck").checked = false;
    }
    updateTotals();
  });
  document.getElementById("promoCheck").addEventListener("change", () => {
    if (document.getElementById("promoCheck").checked) {
      document.getElementById("seniorCheck").checked = false;
    }
    updateTotals();
  });
  document.getElementById("promoType").addEventListener("change", updateTotals);
  document.getElementById("promoValue").addEventListener("input", updateTotals);

  document.getElementById("paymentMethod").addEventListener("change", handlePaymentChange);
  document.getElementById("amountTendered").addEventListener("input", updateChange);

  document.getElementById("newOrder").addEventListener("click", () => {
    document.getElementById("receiptModal").classList.remove("open");
  });

  document.getElementById("printReceipt").addEventListener("click", () => {
    const receipt = document.getElementById("receipt").cloneNode(true);
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Receipt</title><style>body{font-family:'Courier New',monospace;padding:20px;}</style></head><body></body></html>`);
    win.document.body.appendChild(receipt);
    win.print();
  });

  document.getElementById("printThermalBtn").addEventListener("click", () => {
    const order = JSON.parse(document.getElementById("receipt").dataset.order);
    printThermal(order);
  });

  [document.getElementById("checkoutModal"), document.getElementById("receiptModal"), document.getElementById("customModal"), document.getElementById("heldModal")].forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("open");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  wireEvents();
  init();
});
