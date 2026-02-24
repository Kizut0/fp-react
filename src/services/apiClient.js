import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
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
