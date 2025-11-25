const BASE_URL = "https://test-api-9gkd.vercel.app/api/v1";

async function request(method, path, data) {
  const headers = { "Content-Type": "application/json" };
  const opts = { method, headers, credentials: "include" }; // include cookies

  if (data) opts.body = JSON.stringify(data);

  const res = await fetch(BASE_URL + path, opts);
  // return parsed JSON when possible
  let payload = null;
  try {
    payload = await res.json();
  } catch (e) {
    payload = null;
  }
  return payload;
}

const api = {
  get: (p) => request("GET", p),
  post: (p, d) => request("POST", p, d),
  patch: (p, d) => request("PATCH", p, d),
  delete: (p) => request("DELETE", p),
};
