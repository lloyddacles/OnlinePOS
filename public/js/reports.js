const state = {
  report: null
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function last7Days() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10);
}

async function loadReport() {
  const start = document.getElementById("startDate").value || last7Days();
  const end = document.getElementById("endDate").value || todayISO();
  try {
    const report = await api(`/api/reports?start=${start}&end=${end}`);
    state.report = report;
    render(report);
  } catch (err) {
    showToast(err.message);
  }
}

function render(report) {
  document.getElementById("repRevenue").textContent = fmt(report.revenue);
  document.getElementById("repOrders").textContent = report.orderCount;
  document.getElementById("repAverage").textContent = fmt(report.averageOrder);
  document.getElementById("repTop").textContent = report.items[0] ? report.items[0].name : "—";

  const items = document.getElementById("itemsTable");
  items.innerHTML = report.items.length
    ? report.items
        .map(
          (i) => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${fmt(i.revenue)}</td></tr>`
        )
        .join("")
    : `<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:16px;">No sales in this period.</td></tr>`;

  const payments = document.getElementById("paymentsTable");
  const entries = Object.entries(report.payments).length
    ? Object.entries(report.payments).sort((a, b) => b[1] - a[1])
    : [];
  payments.innerHTML = entries.length
    ? entries.map(([method, total]) => `<tr><td>${method}</td><td>${fmt(total)}</td></tr>`).join("")
    : `<tr><td colspan="2" style="text-align:center;color:var(--muted);padding:16px;">No sales in this period.</td></tr>`;

  drawChart(report.daily);
}

function drawChart(daily) {
  const canvas = document.getElementById("salesChart");
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const colors = ["#4a7c59", "#b5651d", "#8a857e"];
  ctx.clearRect(0, 0, width, height);

  const max = Math.max(...daily.map((d) => d.sales), 1);
  const pad = { top: 16, right: 8, bottom: 28, left: 52 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  ctx.strokeStyle = "#e7e0d6";
  ctx.fillStyle = "#8a857e";
  ctx.font = "11px system-ui";

  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i;
    const value = ((max * (4 - i)) / 4).toFixed(0);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
    ctx.fillText("₱" + value, 4, y + 4);
  }

  if (daily.length === 0) {
    ctx.fillStyle = "#8a857e";
    ctx.fillText("No data", width / 2 - 20, height / 2);
    return;
  }

  const barW = Math.min(44, (chartW / daily.length) * 0.6);
  const gap = chartW / daily.length;
  daily.forEach((d, i) => {
    const barH = (d.sales / max) * chartH;
    const x = pad.left + gap * i + (gap - barW) / 2;
    const y = pad.top + chartH - barH;

    ctx.fillStyle = i % 2 === 0 ? colors[0] : colors[1];
    ctx.fillRect(x, y, barW, barH);

    ctx.fillStyle = "#2b2b2b";
    ctx.font = "10px system-ui";
    const label = d.day.slice(5).replace("-", "/");
    ctx.fillText(label, x + barW / 2 - 12, pad.top + chartH + 14);
  });
}

function exportCsv() {
  const report = state.report;
  if (!report) {
    showToast("Generate a report first");
    return;
  }

  const rows = [["Date", "Orders", "Sales"]];
  for (const d of report.daily) {
    rows.push([d.day, d.orders, d.sales.toFixed(2)]);
  }
  rows.push([]);
  rows.push(["Product", "Qty Sold", "Revenue"]);
  for (const i of report.items) {
    rows.push([i.name, i.qty, i.revenue.toFixed(2)]);
  }
  rows.push([]);
  rows.push(["Payment Method", "Revenue"]);
  for (const [method, total] of Object.entries(report.payments)) {
    rows.push([method, total.toFixed(2)]);
  }

  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rocks-and-teas-report-${report.start}-to-${report.end}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("CSV downloaded");
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
  document.getElementById("startDate").value = last7Days();
  document.getElementById("endDate").value = todayISO();
  document.getElementById("loadReport").addEventListener("click", loadReport);
  document.getElementById("exportCsv").addEventListener("click", exportCsv);
  window.addEventListener("resize", () => {
    if (state.report) drawChart(state.report.daily);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  wireEvents();
  checkAuth();
  loadReport();
});
