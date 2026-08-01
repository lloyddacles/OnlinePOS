document.getElementById("pwForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const current = document.getElementById("pwCurrent").value;
  const next = document.getElementById("pwNext").value;
  const confirm = document.getElementById("pwConfirm").value;

  if (next.length < 6) {
    showToast("New password must be at least 6 characters");
    return;
  }
  if (next !== confirm) {
    showToast("Passwords do not match");
    return;
  }

  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  btn.textContent = "Updating...";

  try {
    await api("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, next })
    });
    window.location.href = "/";
  } catch (err) {
    showToast(err.message);
    btn.disabled = false;
    btn.textContent = "Update Password";
  }
});
