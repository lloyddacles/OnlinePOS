const state = {
  orders: [],
  filter: "active",
  voidingId: null
};

async function loadOrders() {
  try {
    const [completed, ready, voided] = await Promise.all([
      api("/api/orders?status=Completed"),
      api("/api/orders?status=Ready"),
      api("/api/orders?status=Voided")
    ]);
    state.orders = [...completed, ...ready, ...voided];
    render();
  } catch (err) {
    showToast(err.message);
  }
}

function render() {
  const grid = document.getElementById("queueGrid");

  let filtered;
  if (state.filter === "active") {
    filtered = state.orders.filter((o) => o.status === "Completed" || o.status === "Ready");
  } else if (state.filter === "picked") {
    filtered = state.orders.filter((o) => o.status === "Picked Up");
  } else {
    filtered = state.orders.filter((o) => o.status === "Voided");
  }

  const sorted = [...filtered].sort((a, b) => (state.filter === "active" ? a.id - b.id : b.id - a.id));

  if (sorted.length === 0) {
    grid.innerHTML = `<div class="queue-empty">${state.filter === "active" ? "No orders waiting. 🧋" : "Nothing here yet."}</div>`;
    return;
  }

  grid.innerHTML = sorted
    .map((o) => {
      const items = o.items
        .map(
          (item) => `
            <div>${item.quantity} x ${item.name}</div>
            ${item.addons.map((a) => `<div class="q-addons">+ ${a.name}</div>`).join("")}
          `
        )
        .join("");

      const actions =
        state.filter === "voided"
          ? `<div style="font-size:12px;color:var(--danger);margin-top:6px;">Voided: ${o.void_reason || "No reason"}</div>`
          : `<div class="q-actions">
              ${o.status === "Completed" ? `<button class="q-ready" data-id="${o.id}" data-status="Ready">Ready</button>` : ""}
              ${o.status === "Ready" ? `<button class="q-pickup" data-id="${o.id}" data-status="Picked Up">Picked Up</button>` : ""}
              <button class="q-void" data-id="${o.id}" data-void="1">Void</button>
            </div>`;

      return `
        <div class="queue-card status-${o.status.toLowerCase().replace(" ", "-")}">
          <div style="display:flex;justify-content:space-between;align-items:start;">
            <div>
              <div class="q-num">#${o.order_number.split("-").pop()}</div>
              <div class="q-time">${formatDate(o.created_at)} · ${o.payment_method}</div>
            </div>
            <div style="text-align:right;">
              <div class="q-total">${fmt(o.total)}</div>
              <div style="font-size:11px;color:var(--muted);">${o.customer_name || "Walk-in"}</div>
            </div>
          </div>
          <div class="q-items">${items}</div>
          ${actions}
        </div>`;
    })
    .join("");

  grid.querySelectorAll("[data-status]").forEach((btn) => {
    btn.addEventListener("click", () => updateStatus(Number(btn.dataset.id), btn.dataset.status));
  });
  grid.querySelectorAll("[data-void]").forEach((btn) => {
    btn.addEventListener("click", () => openVoid(Number(btn.dataset.id)));
  });
}

async function updateStatus(id, status) {
  try {
    await api(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    showToast(status === "Ready" ? "Marked as ready for pickup" : "Marked as picked up");
    await loadOrders();
  } catch (err) {
    showToast(err.message);
  }
}

function openVoid(id) {
  const order = state.orders.find((o) => o.id === id);
  state.voidingId = id;
  document.getElementById("voidOrderNum").textContent = order.order_number;
  document.getElementById("voidReason").value = "";
  document.getElementById("voidModal").classList.add("open");
}

async function confirmVoid() {
  const reason = document.getElementById("voidReason").value.trim();
  if (!reason) {
    showToast("A reason is required to void");
    return;
  }
  try {
    await api(`/api/orders/${state.voidingId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Voided", void_reason: reason })
    });
    document.getElementById("voidModal").classList.remove("open");
    showToast("Order voided");
    await loadOrders();
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
  document.querySelectorAll(".queue-toggle button[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filter = btn.dataset.filter;
      document.querySelectorAll(".queue-toggle button[data-filter]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      render();
    });
  });
  document.getElementById("refreshQueue").addEventListener("click", loadOrders);
  document.getElementById("cancelVoid").addEventListener("click", () => {
    document.getElementById("voidModal").classList.remove("open");
  });
  document.getElementById("confirmVoid").addEventListener("click", confirmVoid);
  document.getElementById("voidModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("voidModal")) document.getElementById("voidModal").classList.remove("open");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  wireEvents();
  checkAuth();
  loadOrders();
  setInterval(loadOrders, 15000);
});
