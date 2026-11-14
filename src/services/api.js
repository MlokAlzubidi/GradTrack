
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add JWT token to every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("gradtrack-token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;
    const requestUrl = (error.config?.url || "").split("?")[0];

    // Do not clear the session for expected authentication errors
    const excludedUrls = [
      "/auth/login",
      "/auth/register",
      "/users/me/password",
    ];

    const shouldExclude = excludedUrls.some(
      (url) => requestUrl === url || requestUrl.endsWith(url)
    );

    if (status === 401 && !shouldExclude) {
      const isSupervisor = window.location.pathname.startsWith(
        "/supervisor"
      );

      // Clear authentication data
      sessionStorage.removeItem("gradtrack-token");
      sessionStorage.removeItem("gradtrack-current-student");
      sessionStorage.removeItem("gradtrack-current-supervisor");

      // Redirect to the correct login page
      const loginPath = isSupervisor
        ? "/supervisor/login"
        : "/login";

      if (window.location.pathname !== loginPath) {
        window.location.replace(loginPath);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
