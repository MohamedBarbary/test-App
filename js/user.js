const jobsWrap = document.getElementById("jobsWrap");
const addJobBtn = document.getElementById("addJobBtn");
const logoutBtn = document.getElementById("logoutBtn");
const backBtn = document.getElementById("backBtn");
const placeInput = document.getElementById("place");
const descInput = document.getElementById("description");
const salaryInput = document.getElementById("salary");
const jobMsg = document.getElementById("jobMsg");
const pageTitle = document.getElementById("pageTitle");
const jobFormTitle = document.getElementById("jobFormTitle");

logoutBtn.addEventListener("click", () => {
  fetch("https://test-api-9gkd.vercel.app/api/v1/users/logout", {
    method: "POST",
    credentials: "include",
  }).finally(() => {
    localStorage.clear();
    location.href = "../index.html";
  });
});
backBtn &&
  backBtn.addEventListener("click", () => (location.href = "../index.html"));

addJobBtn.addEventListener("click", createJob);

const currentUser = JSON.parse(localStorage.getItem("user") || "null");
const openUserId = localStorage.getItem("openUserId"); // set by admin when opening a user
const openUserName = localStorage.getItem("openUserName") || "";
const adminView = currentUser?.admin && openUserId; // admin clicked a user
const normalUserView = !currentUser?.admin; // normal user

// Initialize UI
if (adminView) {
  pageTitle.textContent = `Jobs of ${openUserName || openUserId}`;
  jobFormTitle.textContent = "Add Job for user";
  salaryInput.disabled = false; // admin can set salary on create
} else {
  pageTitle.textContent = "My Jobs";
  jobFormTitle.textContent = "Add Job";
  salaryInput.disabled = true; // normal user cannot set salary (admin only)
}

// load jobs for the correct user id
async function loadJobs() {
  jobsWrap.innerHTML = '<div class="note">Loading jobs…</div>';

  let userId;

  if (adminView) {
    // If admin is viewing a specific user
    userId = openUserId;
  } else if (currentUser) {
    // Non-admin user: always fetch their own jobs
    userId = currentUser.id;
  } else {
    jobsWrap.innerHTML = '<div class="note">No user logged in</div>';
    return;
  }

  // Fetch jobs for this user
  const res = await api.get(`/jobs/my?userId=${userId}`);

  if (!res || res.status !== "success") {
    jobsWrap.innerHTML = '<div class="note">Error loading jobs</div>';
    return;
  }

  const jobs = res.jobs || res.data || [];
  if (!jobs.length) {
    jobsWrap.innerHTML = '<div class="note">No jobs yet</div>';
    return;
  }

  let html = '<div class="jobs-list">';
  jobs.forEach((j) => {
    html += `<div class="job-row">
      <div class="job-top">
        <div class="job-meta">
          <div class="job-place">${escapeHtml(j.place || "")}</div>
          <div class="muted-sm">${escapeHtml(j.description || "")}</div>
        </div>
        ${j.paid ? `<div class="cool-paid">PAID</div>` : ""}
      </div>

      <div class="job-actions">
        <div class="muted-sm">Salary: ${j.salary ?? "—"}</div>
        <div style="margin-left:auto" class="job-actions">`;

    // Admin actions
    if (currentUser?.admin) {
      if (!j.paid)
        html += `<button class="btn small" onclick="markPaid('${j._id}')">Mark Paid</button>`;
      html += `<button class="btn small ghost" onclick="setSalary('${j._id}')">Set Salary</button>`;
      html += `<button class="btn small ghost" onclick="deleteJob('${j._id}')">Delete</button>`;
    } else {
      // Non-admin: only allowed to see jobs, cannot modify
      html += `<span class="muted-sm">You cannot modify jobs</span>`;
    }

    html += `</div></div></div>`;
  });
  html += "</div>";

  jobsWrap.innerHTML = html;
}

async function createJob() {
  jobMsg.textContent = "";
  const place = placeInput.value.trim();
  const description = descInput.value.trim();
  const salary = salaryInput.value ? Number(salaryInput.value) : undefined;

  if (!place || !description) {
    jobMsg.textContent = "Place and description are required";
    return;
  }

  let payload = { place, description };
  // admin adding for another user?
  if (adminView) {
    if (typeof salary !== "undefined") payload.salary = salary;
    payload.user = openUserId; // assume backend allows user field for admin
  } else {
    // normal user — no salary allowed, server will set user from cookie
  }

  const res = await api.post("/jobs", payload);
  if (!res || res.status !== "success") {
    jobMsg.textContent = res?.message || "Create failed";
    return;
  }

  // clear fields
  placeInput.value = "";
  descInput.value = "";
  salaryInput.value = "";
  loadJobs();
}

async function markPaid(id) {
  if (!confirm("Mark job as paid?")) return;
  await api.patch(`/jobs/${id}`, { paid: true });
  loadJobs();
}

async function setSalary(id) {
  const val = prompt("Set salary amount:");
  if (val === null) return;
  const num = Number(val);
  if (!Number.isFinite(num)) {
    alert("Invalid number");
    return;
  }
  await api.patch(`/jobs/${id}`, { salary: num });
  loadJobs();
}

async function deleteJob(id) {
  if (!confirm("Delete this job?")) return;
  await api.delete(`/jobs/${id}`);
  loadJobs();
}

function escapeHtml(s) {
  return (s || "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

loadJobs();
