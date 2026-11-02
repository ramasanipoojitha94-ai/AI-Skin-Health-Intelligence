const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8002"
).replace(/\/+$/, "");

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("dermalytixToken");

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`,
      {
        ...options,
        headers,
      }
    );
  } catch {
    throw new Error(
      "Cannot connect to DermaLytix. Make sure the backend server is running on port 8001."
    );
  }

  const contentType = response.headers.get("content-type") || "";

  let data;

  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => ({}));
  } else {
    data = await response.text().catch(() => "");
  }

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data.detail || data.message;

    if (response.status === 401) {
      localStorage.removeItem("dermalytixToken");
      localStorage.removeItem("dermalytixUser");

      throw new Error(
        "Your session has expired. Please log in again."
      );
    }

    throw new Error(
      message || `Request failed with status ${response.status}.`
    );
  }

  return data;
}

export { API_BASE_URL };