document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Login failed");
    }
    window.location.href = "/";
  } catch (err) {
    showToast(err.message);
  }
});
