const usersWrap = document.getElementById("usersWrap");
const addUserBtn = document.getElementById("addUserBtn");
const createMsg = document.getElementById("createMsg");
const logoutBtn = document.getElementById("logoutBtn");
const backBtn = document.getElementById("backBtn");

logoutBtn.addEventListener("click", () => {
  // call logout endpoint if you implemented it (clears cookie)
  fetch("http://localhost:5000/api/v1/users/logout", {
    method: "POST",
    credentials: "include",
  }).finally(() => {
    localStorage.clear();
    location.href = "../index.html";
  });
});

backBtn &&
  backBtn.addEventListener("click", () => {
    // small UX: go back to index
    location.href = "../index.html";
  });

addUserBtn.addEventListener("click", addUser);

async function loadUsers() {
  usersWrap.innerHTML = '<div class="note">Loading users…</div>';
  const res = await api.get("/users"); // admin only
  if (!res || res.status !== "success") {
    usersWrap.innerHTML = '<div class="note">Error loading users</div>';
    return;
  }

  const users = res.data;

  // For each user we also need total unpaid — backend must provide jobs or we fetch per user
  // To reduce requests, backend could include total unpaid; if not, we compute by fetching jobs per user
  const rows = await Promise.all(
    users.map(async (u) => {
      // fetch jobs for user (unpaid)
      const jres = await api.get(`/jobs/all?userId=${u._id}`);
      const jobs = jres?.jobs || [];
      const unpaidTotal = jobs.reduce(
        (s, j) => s + (j.paid || false ? 0 : j.salary || 0),
        0
      );
      return { user: u, unpaidTotal, jobsCount: jobs.length };
    })
  );

  let html = '<div class="users-list">';
  rows.forEach((r) => {
    const u = r.user;
    html += `
      <div class="user-row">
        <div class="user-left">
          <div><strong>${escapeHtml(u.fullName)}</strong></div>
          <div class="muted-sm">${escapeHtml(u.phone)}</div>
        </div>

        <div class="user-actions">
          <div class="total-amount">Unpaid: <span class="unpaid">${
            r.unpaidTotal
          }</span></div>
          <div class="badge">${r.jobsCount} jobs</div>
          <div>
            <button class="btn small" onclick="openUserJobs('${
              u._id
            }','${escapeJs(u.fullName)}')">Open</button>
            <button class="btn small ghost" onclick="deleteUser('${
              u._id
            }')">Delete</button>
          </div>
        </div>
      </div>`;
  });
  html += "</div>";

  usersWrap.innerHTML = html;
}

async function addUser() {
  createMsg.textContent = "";
  const payload = {
    fullName: document.getElementById("fullName").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    password: document.getElementById("password").value,
    passwordConfirm: document.getElementById("passwordConfirm").value,
    // admin not allowed here — only first admin exists
  };

  if (!payload.fullName || !payload.phone || !payload.password) {
    createMsg.textContent = "Please fill all fields";
    return;
  }

  const res = await api.post("/users", payload);
  if (!res || res.status !== "success") {
    createMsg.textContent = res?.message || "Create failed";
    return;
  }

  // clear form
  document.getElementById("fullName").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("password").value = "";
  document.getElementById("passwordConfirm").value = "";

  loadUsers();
}

async function deleteUser(id) {
  if (!confirm("Delete this user?")) return;
  const res = await api.delete(`/users/${id}`);
  if (!res || res.status === "fail") {
    alert(res?.message || "Delete failed");
  }
  loadUsers();
}

// When admin opens a user, store openUserId and go to user.html
function openUserJobs(id, name) {
  localStorage.setItem("openUserId", id);
  localStorage.setItem("openUserName", name || "");
  location.href = "user.html";
}

function escapeHtml(s) {
  return (s || "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function escapeJs(s) {
  return (s || "").replace(/'/g, "\\'").replace(/\"/g, '\\"');
}

loadUsers();
