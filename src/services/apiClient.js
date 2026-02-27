import axios from "axios";

const normalizeBaseURL = (rawUrl) => {
  if (!rawUrl) {
    return "/api";
  }

  const trimmed = String(rawUrl).trim().replace(/\/+$/, "");

  if (!trimmed) {
    return "/api";
  }

  const ensureApiSuffix = (value) => (value.endsWith("/api") ? value : `${value}/api`);

  if (trimmed.startsWith("/")) {
    return ensureApiSuffix(trimmed);
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const isHttpsPage =
        typeof window !== "undefined" &&
        String(window.location?.protocol || "").toLowerCase() === "https:";
      const isLocalHost =
        parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

      // Prevent mixed-content login/API failures on HTTPS deployments.
      if (isHttpsPage && parsed.protocol === "http:" && !isLocalHost) {
        parsed.protocol = "https:";
      }

      return ensureApiSuffix(parsed.toString().replace(/\/+$/, ""));
    } catch {
      return ensureApiSuffix(trimmed);
    }
  }

  const browserProtocol =
    typeof window !== "undefined" && String(window.location?.protocol || "").toLowerCase() === "https:"
      ? "https://"
      : "";
  const localHostLike =
    /^localhost(?::\d+)?$/i.test(trimmed) ||
    /^127\.0\.0\.1(?::\d+)?$/i.test(trimmed);
  const prefix = browserProtocol || (localHostLike ? "http://" : "https://");

  return ensureApiSuffix(`${prefix}${trimmed}`);
};

const isLocalRuntime = () => {
  if (typeof window === "undefined") return false;
  const host = String(window.location?.hostname || "").toLowerCase();
  return host === "127.0.0.1" || host === "localhost";
};

const resolveBaseURL = () => {
  const forceAbsolute = String(import.meta.env.VITE_FORCE_ABSOLUTE_API_URL || "")
    .trim()
    .toLowerCase() === "true";

  if (isLocalRuntime() && !forceAbsolute) {
    return "/api";
  }

  return normalizeBaseURL(import.meta.env.VITE_API_URL);
};

const apiClient = axios.create({
  baseURL: resolveBaseURL(),
  withCredentials: true,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000),
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("fl_token") || localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      error.message = "Request timed out. Please check your connection and try again.";
    } else if (!error.response && error.message === "Network Error") {
      error.message = "Cannot reach server. Please check API URL/CORS and try again.";
    }

    const status = error.response?.status;
    const requestUrl = String(error.config?.url || "");
    const isLoginOrRegisterRequest =
      requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register");
    const hasToken = Boolean(
      localStorage.getItem("fl_token") || localStorage.getItem("token")
    );

    if (status === 401 && hasToken && !isLoginOrRegisterRequest) {
      localStorage.removeItem("fl_token");
      localStorage.removeItem("fl_user");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default apiClient;
