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

const state = {
  products: [],
  categories: [],
  orders: [],
  addons: [],
  promos: [],
  productFilter: "All",
  activeOrder: null
};

async function loadDashboard() {
  try {
    const data = await api("/api/stats/dashboard");

    const today = new Date().toLocaleDateString("en-PH", {
      weekday: "long",
      month: "long",
      day: "numeric"
    });

    document.getElementById("statSales").textContent = fmt(data.totalSales);
    document.getElementById("statSalesDate").textContent = today;
    document.getElementById("statOrders").textContent = data.totalOrders;
    document.getElementById("statAvg").textContent = fmt(data.averageOrder);
    document.getElementById("statProducts").textContent = data.productCount;
    document.getElementById("statCategories").textContent = `${data.categoryCount} categories`;
    document.getElementById("statTop").textContent = data.topItem || "—";
    document.getElementById("statVoid").textContent = `${data.voidCount} voided today`;

    renderOrders(data.recentOrders);
  } catch (err) {
    showToast(err.message);
  }
}

async function loadProducts() {
  try {
    state.products = await api("/api/products");
    state.categories = await api("/api/products/categories");
    renderProductFilter();
    renderProducts();
    populateCategorySelect();
  } catch (err) {
    showToast(err.message);
  }
}

async function loadOrders() {
  try {
    state.orders = await api("/api/orders?limit=20");
    renderOrders(state.orders);
  } catch (err) {
    showToast(err.message);
  }
}

async function loadAddons() {
  try {
    state.addons = await api("/api/addons");
    renderAddons();
  } catch (err) {
    showToast(err.message);
  }
}

async function loadPromos() {
  try {
    state.promos = await api("/api/promos");
    renderPromos();
  } catch (err) {
    showToast(err.message);
  }
}

function renderPromos() {
  const tbody = document.getElementById("promosTable");
  if (state.promos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px;">No promos yet.</td></tr>`;
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  tbody.innerHTML = state.promos
    .map((p) => {
      const validity = p.start_date || p.end_date
        ? `${p.start_date || "…"} → ${p.end_date || "…"}`
        : "Always";
      const expired = p.end_date && today > p.end_date;
      const notStarted = p.start_date && today < p.start_date;
      const status = !p.active ? "Off" : expired ? "Expired" : notStarted ? "Upcoming" : "Active";
      const statusClass = status === "Active" ? "ok" : "no";
      return `
        <tr>
          <td><strong>${p.code}</strong></td>
          <td>${p.discount_type === "percent" ? p.discount_value + "%" : fmt(p.discount_value)}</td>
          <td>${p.min_subtotal ? fmt(p.min_subtotal) : "—"}</td>
          <td style="font-size:12px;">${validity}</td>
          <td>${p.used_count}${p.max_uses != null ? "/" + p.max_uses : ""}</td>
          <td><span class="badge ${statusClass}">${status}</span></td>
          <td style="white-space:nowrap;">
            <button class="icon-btn edit-promo" data-id="${p.id}" title="Edit">✏️</button>
            <button class="icon-btn danger delete-promo" data-id="${p.id}" title="Delete">🗑️</button>
          </td>
        </tr>`;
    })
    .join("");

  tbody.querySelectorAll(".edit-promo").forEach((btn) => {
    btn.addEventListener("click", () => openPromoModal(Number(btn.dataset.id)));
  });
  tbody.querySelectorAll(".delete-promo").forEach((btn) => {
    btn.addEventListener("click", () => deletePromo(Number(btn.dataset.id)));
  });
}

function openPromoModal(id) {
  const modal = document.getElementById("promoModal");
  document.getElementById("promoModalTitle").textContent = id ? "Edit Promo" : "Add Promo";
  document.getElementById("promoId").value = id || "";

  const promo = state.promos.find((p) => p.id === id);
  document.getElementById("promoCode").value = promo ? promo.code : "";
  document.getElementById("promoDiscountType").value = promo ? promo.discount_type : "percent";
  document.getElementById("promoDiscountValue").value = promo ? promo.discount_value : "";
  document.getElementById("promoMinSubtotal").value = promo ? promo.min_subtotal : 0;
  document.getElementById("promoDescription").value = promo ? promo.description || "" : "";
  document.getElementById("promoStartDate").value = promo ? promo.start_date || "" : "";
  document.getElementById("promoEndDate").value = promo ? promo.end_date || "" : "";
  document.getElementById("promoMaxUses").value = promo ? (promo.max_uses != null ? promo.max_uses : "") : "";
  document.getElementById("promoActive").checked = promo ? Boolean(promo.active) : true;

  modal.classList.add("open");
}

async function savePromo() {
  const id = document.getElementById("promoId").value;
  const payload = {
    code: document.getElementById("promoCode").value.trim(),
    discount_type: document.getElementById("promoDiscountType").value,
    discount_value: Number(document.getElementById("promoDiscountValue").value),
    min_subtotal: Number(document.getElementById("promoMinSubtotal").value) || 0,
    description: document.getElementById("promoDescription").value.trim(),
    start_date: document.getElementById("promoStartDate").value,
    end_date: document.getElementById("promoEndDate").value,
    max_uses: document.getElementById("promoMaxUses").value ? Number(document.getElementById("promoMaxUses").value) : null,
    active: document.getElementById("promoActive").checked
  };

  if (!payload.code || isNaN(payload.discount_value) || payload.discount_value <= 0) {
    showToast("Enter a code and a discount value greater than 0");
    return;
  }
  if (payload.discount_type === "percent" && payload.discount_value > 100) {
    showToast("Percent discount cannot exceed 100");
    return;
  }

  try {
    if (id) {
      await api(`/api/promos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      showToast("Promo updated");
    } else {
      await api("/api/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      showToast("Promo created");
    }
    document.getElementById("promoModal").classList.remove("open");
    await loadPromos();
  } catch (err) {
    showToast(err.message);
  }
}

async function deletePromo(id) {
  if (!confirm("Delete this promo?")) return;
  try {
    await api(`/api/promos/${id}`, { method: "DELETE" });
    showToast("Promo deleted");
    await loadPromos();
  } catch (err) {
    showToast(err.message);
  }
}

function renderProductFilter() {
  const bar = document.getElementById("productCategoryBar");
  const all = ["All", ...state.categories];
  bar.innerHTML = all
    .map((cat) => `<button data-cat="${cat}" class="${cat === state.productFilter ? "active" : ""}">${cat}</button>`)
    .join("");

  bar.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.productFilter = btn.dataset.cat;
      renderProductFilter();
      renderProducts();
    });
  });
}

function renderProducts() {
  const tbody = document.getElementById("productsTable");
  const filtered =
    state.productFilter === "All"
      ? state.products
      : state.products.filter((p) => p.category === state.productFilter);

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px;">No products.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map(
      (p) => `
        <tr>
          <td>
            <strong>${CATEGORY_EMOJI[p.category] || "🥤"} ${p.name}</strong>
            ${p.barcode ? `<div style="color:var(--muted);font-size:11px;">${p.barcode}</div>` : ""}
          </td>
          <td><span class="badge category">${p.category}</span></td>
          <td>${fmt(p.price)}</td>
          <td>
            <button class="badge ${p.available ? "ok" : "no"} toggle-avail" data-id="${p.id}">${p.available ? "Available" : "Hidden"}</button>
          </td>
          <td style="white-space:nowrap;">
            <button class="icon-btn edit-btn" data-id="${p.id}" title="Edit">✏️</button>
            <button class="icon-btn danger delete-btn" data-id="${p.id}" title="Delete">🗑️</button>
          </td>
        </tr>`
    )
    .join("");

  tbody.querySelectorAll(".toggle-avail").forEach((btn) => {
    btn.addEventListener("click", () => toggleAvailability(Number(btn.dataset.id)));
  });
  tbody.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => openProductModal(Number(btn.dataset.id)));
  });
  tbody.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteProduct(Number(btn.dataset.id)));
  });
}

function renderAddons() {
  const tbody = document.getElementById("addonsTable");
  if (state.addons.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px;">No add-on options.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.addons
    .map(
      (a) => `
        <tr>
          <td><strong>${a.name}</strong></td>
          <td><span class="badge category">${a.type}</span></td>
          <td>${a.price ? fmt(a.price) : "Free"}</td>
          <td>
            <button class="badge ${a.available ? "ok" : "no"} toggle-addon" data-id="${a.id}">${a.available ? "On" : "Off"}</button>
          </td>
          <td style="white-space:nowrap;">
            <button class="icon-btn edit-addon" data-id="${a.id}" title="Edit">✏️</button>
            <button class="icon-btn danger delete-addon" data-id="${a.id}" title="Delete">🗑️</button>
          </td>
        </tr>`
    )
    .join("");

  tbody.querySelectorAll(".toggle-addon").forEach((btn) => {
    btn.addEventListener("click", () => toggleAddon(Number(btn.dataset.id)));
  });
  tbody.querySelectorAll(".edit-addon").forEach((btn) => {
    btn.addEventListener("click", () => openAddonModal(Number(btn.dataset.id)));
  });
  tbody.querySelectorAll(".delete-addon").forEach((btn) => {
    btn.addEventListener("click", () => deleteAddon(Number(btn.dataset.id)));
  });
}

function populateCategorySelect() {
  const select = document.getElementById("productCategory");
  select.innerHTML = state.categories
    .map((cat) => `<option value="${cat}">${cat}</option>`)
    .join("");
}

function renderOrders(orders) {
  const tbody = document.getElementById("ordersTable");
  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px;">No orders yet.</td></tr>`;
    return;
  }

  const badge = (status) => {
    const map = {
      Completed: "ok",
      Ready: "ok",
      "Picked Up": "no",
      Voided: "no"
    };
    return `<span class="badge ${map[status] || ""}">${status}</span>`;
  };

  tbody.innerHTML = orders
    .map(
      (o) => `
        <tr style="cursor:pointer;" class="order-row" data-id="${o.id}">
          <td><strong>${o.order_number}</strong></td>
          <td>${formatDate(o.created_at)}</td>
          <td>${o.customer_name || "Walk-in"}</td>
          <td>${o.payment_method}</td>
          <td>${badge(o.status)}</td>
          <td><strong>${fmt(o.total)}</strong></td>
        </tr>`
    )
    .join("");

  tbody.querySelectorAll(".order-row").forEach((row) => {
    row.addEventListener("click", () => openOrder(Number(row.dataset.id)));
  });
}

async function openOrder(id) {
  try {
    const order = await api(`/api/orders/${id}`);
    state.activeOrder = order;
    const items = order.items
      .map((item) => {
        const addonLines = (item.addons || [])
          .map((a) => `<div class="r-row" style="color:var(--muted);font-size:12px;"><span>&nbsp;&nbsp;+ ${a.name}</span></div>`)
          .join("");
        return `<div class="r-row"><span>${item.quantity} x ${item.name}</span><span>${fmt(item.line_total)}</span></div>${addonLines}`;
      })
      .join("");

    document.getElementById("orderNumber").textContent = order.order_number;
    document.getElementById("orderMeta").textContent = `${formatDate(order.created_at)} · ${order.customer_name || "Walk-in"} · ${order.payment_method} · ${order.status}`;
    document.getElementById("orderReceipt").innerHTML = `
      <div class="r-header">
        <h3>ROCKS & TEAS</h3>
        <div>Order #${order.order_number}</div>
      </div>
      ${items}
      <div class="r-divider"></div>
      <div class="r-row"><span>Subtotal</span><span>${fmt(order.subtotal)}</span></div>
      ${order.discount > 0 ? `<div class="r-row" style="color:var(--danger);"><span>${order.discount_type === "senior" ? "Senior/PWD" : order.promo_code || "Promo"}</span><span>-${fmt(order.discount)}</span></div>` : ""}
      <div class="r-row"><span>VAT</span><span>${fmt(order.tax)}</span></div>
      <div class="r-row r-total"><span>TOTAL</span><span>${fmt(order.total)}</span></div>
      <div class="r-divider"></div>
      <div class="r-row"><span>${order.payment_method}</span><span>${fmt(order.amount_tendered)}</span></div>
      <div class="r-row"><span>Change</span><span>${fmt(order.change_due)}</span></div>
      ${order.status === "Voided" ? `<div style="color:var(--danger);font-weight:700;margin-top:6px;">VOIDED: ${order.void_reason || ""}</div>` : ""}
    `;

    const voidBtn = document.getElementById("voidOrderBtn");
    voidBtn.style.display = order.status === "Voided" ? "none" : "inline-block";

    document.getElementById("orderModal").classList.add("open");
  } catch (err) {
    showToast(err.message);
  }
}

async function voidOrder() {
  if (!state.activeOrder) return;
  const reason = prompt(`Void order ${state.activeOrder.order_number}? Enter a reason:`, "Wrong order");
  if (reason === null) return;
  if (!reason.trim()) {
    showToast("Reason required");
    return;
  }
  try {
    await api(`/api/orders/${state.activeOrder.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Voided", void_reason: reason.trim() })
    });
    document.getElementById("orderModal").classList.remove("open");
    showToast("Order voided");
    await loadDashboard();
    await loadOrders();
  } catch (err) {
    showToast(err.message);
  }
}

function openProductModal(id) {
  const modal = document.getElementById("productModal");
  document.getElementById("productModalTitle").textContent = id ? "Edit Drink" : "Add Drink";
  document.getElementById("productId").value = id || "";

  const product = state.products.find((p) => p.id === id);
  document.getElementById("productName").value = product ? product.name : "";
  document.getElementById("productCategory").value = product ? product.category : state.categories[0];
  document.getElementById("productPrice").value = product ? product.price : "";
  document.getElementById("productBarcode").value = product ? product.barcode || "" : "";
  document.getElementById("productDescription").value = product ? product.description || "" : "";
  document.getElementById("productAvailable").checked = product ? Boolean(product.available) : true;

  modal.classList.add("open");
}

async function saveProduct() {
  const id = document.getElementById("productId").value;
  const payload = {
    name: document.getElementById("productName").value.trim(),
    category: document.getElementById("productCategory").value,
    price: Number(document.getElementById("productPrice").value),
    barcode: document.getElementById("productBarcode").value.trim(),
    description: document.getElementById("productDescription").value.trim(),
    available: document.getElementById("productAvailable").checked
  };

  if (!payload.name || !payload.category || isNaN(payload.price) || payload.price < 0) {
    showToast("Please fill in name, category and a valid price");
    return;
  }

  try {
    if (id) {
      await api(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      showToast("Drink updated");
    } else {
      await api("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      showToast("Drink added");
    }
    document.getElementById("productModal").classList.remove("open");
    await loadProducts();
    await loadDashboard();
  } catch (err) {
    showToast(err.message);
  }
}

async function toggleAvailability(id) {
  const product = state.products.find((p) => p.id === id);
  try {
    await api(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !product.available })
    });
    showToast(product.available ? "Hidden from menu" : "Back on menu");
    await loadProducts();
    await loadDashboard();
  } catch (err) {
    showToast(err.message);
  }
}

async function deleteProduct(id) {
  if (!confirm("Delete this drink from the menu?")) return;
  try {
    await api(`/api/products/${id}`, { method: "DELETE" });
    showToast("Drink deleted");
    await loadProducts();
    await loadDashboard();
  } catch (err) {
    showToast(err.message);
  }
}

function openAddonModal(id) {
  const modal = document.getElementById("addonModal");
  document.getElementById("addonModalTitle").textContent = id ? "Edit Option" : "Add Option";
  document.getElementById("addonId").value = id || "";

  const addon = state.addons.find((a) => a.id === id);
  document.getElementById("addonName").value = addon ? addon.name : "";
  document.getElementById("addonType").value = addon ? addon.type : "topping";
  document.getElementById("addonPrice").value = addon ? addon.price : (addon && addon.type === "topping" ? 10 : 0);
  document.getElementById("addonAvailable").checked = addon ? Boolean(addon.available) : true;

  modal.classList.add("open");
}

async function saveAddon() {
  const id = document.getElementById("addonId").value;
  const payload = {
    name: document.getElementById("addonName").value.trim(),
    type: document.getElementById("addonType").value,
    price: Number(document.getElementById("addonPrice").value) || 0,
    available: document.getElementById("addonAvailable").checked
  };

  if (!payload.name) {
    showToast("Name is required");
    return;
  }

  try {
    if (id) {
      await api(`/api/addons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      showToast("Option updated");
    } else {
      await api("/api/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      showToast("Option added");
    }
    document.getElementById("addonModal").classList.remove("open");
    await loadAddons();
  } catch (err) {
    showToast(err.message);
  }
}

async function toggleAddon(id) {
  const addon = state.addons.find((a) => a.id === id);
  try {
    await api(`/api/addons/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !addon.available })
    });
    await loadAddons();
  } catch (err) {
    showToast(err.message);
  }
}

async function deleteAddon(id) {
  if (!confirm("Delete this add-on option?")) return;
  try {
    await api(`/api/addons/${id}`, { method: "DELETE" });
    showToast("Option deleted");
    await loadAddons();
  } catch (err) {
    showToast(err.message);
  }
}

async function loadSettingsForm() {
  try {
    const rows = await api("/api/settings");
    const map = {};
    rows.forEach((r) => (map[r.key] = r.value));
    document.getElementById("setStoreName").value = map.store_name || "";
    document.getElementById("setStoreAddress").value = map.store_address || "";
    document.getElementById("setStorePhone").value = map.store_phone || "";
    document.getElementById("setTaxRate").value = map.tax_rate || 12;
    document.getElementById("setReceiptFooter").value = map.receipt_footer || "";
  } catch (err) {
    showToast(err.message);
  }
}

async function saveSettings() {
  const payload = {
    store_name: document.getElementById("setStoreName").value.trim(),
    store_address: document.getElementById("setStoreAddress").value.trim(),
    store_phone: document.getElementById("setStorePhone").value.trim(),
    tax_rate: Number(document.getElementById("setTaxRate").value) || 12,
    receipt_footer: document.getElementById("setReceiptFooter").value.trim()
  };
  try {
    await api("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    showToast("Settings saved");
  } catch (err) {
    showToast(err.message);
  }
}

async function changePassword() {
  const current = document.getElementById("pwCurrent").value;
  const next = document.getElementById("pwNext").value;
  if (!current || !next) {
    showToast("Enter current and new password");
    return;
  }
  if (next.length < 6) {
    showToast("New password must be at least 6 characters");
    return;
  }
  try {
    await api("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, next })
    });
    document.getElementById("pwCurrent").value = "";
    document.getElementById("pwNext").value = "";
    showToast("Password updated");
  } catch (err) {
    showToast(err.message);
  }
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
    /* redirected by api() */
  }
}

function wireEvents() {
  document.getElementById("addProductBtn").addEventListener("click", () => openProductModal(null));
  document.getElementById("cancelProduct").addEventListener("click", () => {
    document.getElementById("productModal").classList.remove("open");
  });
  document.getElementById("saveProduct").addEventListener("click", saveProduct);
  document.getElementById("closeOrder").addEventListener("click", () => {
    document.getElementById("orderModal").classList.remove("open");
  });
  document.getElementById("voidOrderBtn").addEventListener("click", voidOrder);
  document.getElementById("refreshOrders").addEventListener("click", loadOrders);

  document.getElementById("addAddonBtn").addEventListener("click", () => openAddonModal(null));
  document.getElementById("cancelAddon").addEventListener("click", () => {
    document.getElementById("addonModal").classList.remove("open");
  });
  document.getElementById("saveAddon").addEventListener("click", saveAddon);

  document.getElementById("saveSettings").addEventListener("click", saveSettings);
  document.getElementById("changePwBtn").addEventListener("click", changePassword);

  document.getElementById("addPromoBtn").addEventListener("click", () => openPromoModal(null));
  document.getElementById("cancelPromo").addEventListener("click", () => {
    document.getElementById("promoModal").classList.remove("open");
  });
  document.getElementById("savePromo").addEventListener("click", savePromo);

  [document.getElementById("productModal"), document.getElementById("orderModal"), document.getElementById("addonModal"), document.getElementById("promoModal")].forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("open");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  wireEvents();
  checkAuth();
  loadDashboard();
  loadProducts();
  loadOrders();
  loadAddons();
  loadPromos();
  loadSettingsForm();
});
