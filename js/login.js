const loginBtn = document.getElementById("loginBtn");
const msgEl = document.getElementById("msg");

loginBtn.addEventListener("click", async () => {
  msgEl.textContent = "";
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value;

  if (!phone || !password) {
    msgEl.textContent = "Please enter phone and password";
    return;
  }

  // server must set cookie (httpOnly) and return user info
  const res = await api.post("/users/login", { phone, password });

  if (!res || res.status !== "success") {
    msgEl.textContent = res?.message || "Login failed";
    return;
  }

  // save user data (no token) — cookie handles auth
  localStorage.setItem("user", JSON.stringify(res.data));

  // make sure openUserId is cleared
  localStorage.removeItem("openUserId");

  if (res.data.admin) location.href = "html/admin.html";
  else location.href = "html/user.html";
});
