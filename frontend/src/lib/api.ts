import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token, session ID, and handle FormData
api.interceptors.request.use((config) => {
  // Let browser set correct Content-Type with boundary for FormData
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Always send session ID for guest cart support
    let sessionId = localStorage.getItem("session_id");
    if (!sessionId) {
      sessionId = "sess_" + crypto.randomUUID();
      localStorage.setItem("session_id", sessionId);
    }
    config.headers["X-Session-ID"] = sessionId;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          if (data.success) {
            localStorage.setItem("access_token", data.data.access_token);
            localStorage.setItem("refresh_token", data.data.refresh_token);
            originalRequest.headers.Authorization = `Bearer ${data.data.access_token}`;
            return api(originalRequest);
          }
        }
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
