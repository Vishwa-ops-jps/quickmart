const BASE = import.meta.env.VITE_API_URL || "";
let token = null;
try { token = localStorage.getItem("token"); } catch {}

export const setToken = (t) => {
  token = t;
  try { t ? localStorage.setItem("token", t) : localStorage.removeItem("token"); } catch {}
};

export async function api(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Can't reach the server. Check that the API is running.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || "Something went wrong.");
    err.status = res.status;
    throw err;
  }
  return data;
}
