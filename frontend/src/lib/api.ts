/* eslint-disable @typescript-eslint/no-unused-vars */
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined");
}

if (typeof window !== "undefined") {
  console.log("API_URL:", API_URL);
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    let sessionId = localStorage.getItem("session_id");

    if (!sessionId) {
      sessionId = "sess_" + crypto.randomUUID();
      localStorage.setItem("session_id", sessionId);
    }

    config.headers["X-Session-ID"] = sessionId;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");

        if (refreshToken) {
          const { data } = await api.post("/auth/refresh", {
            refresh_token: refreshToken,
          });

          if (data.success) {
            localStorage.setItem("access_token", data.data.access_token);
            localStorage.setItem("refresh_token", data.data.refresh_token);

            original.headers.Authorization = `Bearer ${data.data.access_token}`;

            return api(original);
          }
        }
      } catch (err) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
