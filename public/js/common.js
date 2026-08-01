let toastTimer;

function fmt(value) {
  return "₱ " + Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDate(value) {
  const d = new Date(value.replace(" ", "T"));
  if (isNaN(d)) return value;
  return d.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function startClock() {
  const el = document.getElementById("clock");
  if (!el) return;
  const tick = () => {
    el.textContent = new Date().toLocaleString("en-PH", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  tick();
  setInterval(tick, 1000);
}

async function api(path, options = {}) {
  const res = await fetch(path, options);
  if (res.status === 401 && !path.includes("/auth/login") && !path.includes("/auth/me")) {
    window.location.href = "/login";
    throw new Error("Session expired");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

async function loadSettings() {
  const settings = {};
  try {
    const rows = await api("/api/settings");
    rows.forEach((row) => {
      settings[row.key] = row.value;
    });
  } catch (err) {
    /* fall back to defaults */
  }
  settings.store_name = settings.store_name || "Rocks and Teas";
  settings.tax_rate = Number(settings.tax_rate) || 12;
  return settings;
}

function renderThermal(container, order) {
  const items = order.items;
  const lines = [];
  const push = (s) => lines.push(s);
  const lineWidth = 32;

  const rule = "-".repeat(lineWidth);
  const dot = (left, right) => {
    const l = left.slice(0, lineWidth - right.length - 1);
    return l + " " + right;
  };

  push(center(container, order.store_name || "ROCKS & TEAS"));
  if (order.store_address) push(center(container, order.store_address.slice(0, lineWidth)));
  push(rule);
  push("Order #" + order.order_number);
  push(center(container, order.created_at));
  if (order.customer_name) push("Cust: " + order.customer_name);
  push(rule);

  for (const item of items) {
    const top = item.quantity + " x " + item.name;
    push(top.slice(0, lineWidth));
    if (item.addons && item.addons.length) {
      for (const addon of item.addons) {
        push(("  + " + addon.name).slice(0, lineWidth));
      }
    }
    push(dot("", fmt(item.line_total)));
  }
  push(rule);
  push(dot("Subtotal", fmt(order.subtotal)));
  if (order.discount > 0) {
    push(dot("Discount", "-" + fmt(order.discount)));
    push(dot("  (" + order.discount_type.toUpperCase() + ")", ""));
  }
  push(dot("VAT " + (order.tax_rate || 12) + "%", fmt(order.tax)));
  push(dot("TOTAL", fmt(order.total)));
  push(rule);
  push(dot(order.payment_method, fmt(order.amount_tendered)));
  push(dot("Change", fmt(order.change_due)));
  if (order.void_reason) push("VOIDED: " + order.void_reason);
  push("");
  push(center(container, order.receipt_footer || "Thank you! Come again!"));
  push("");
  push(center(container, "* * *"));

  container.textContent = lines.join("\n");
}

function center(container, text) {
  const width = 32;
  const t = String(text);
  if (t.length >= width) return t;
  const pad = Math.floor((width - t.length) / 2);
  return " ".repeat(pad) + t;
}

function printThermal(order) {
  const pre = document.createElement("pre");
  renderThermal(pre, order);
  pre.style.cssText = "font-family:'Courier New',monospace;font-size:10px;white-space:pre;";
  const win = window.open("", "_blank", "width=380,height=600");
  win.document.write(
    `<html><head><title>Receipt ${order.order_number}</title><style>@media print{@page{margin:0;}}</style></head><body></body></html>`
  );
  win.document.body.appendChild(pre);
  win.focus();
  setTimeout(() => {
    win.print();
  }, 250);
}

function logout() {
  fetch("/api/auth/logout", { method: "POST" }).finally(() => {
    window.location.href = "/login";
  });
}

document.addEventListener("DOMContentLoaded", startClock);
