import apiClient from "./apiClient";
import endpoints from "./endpoints";

export const authService = {
  async login(credentials) {
    const { data } = await apiClient.post(
      endpoints.AUTH.LOGIN,
      credentials
    );

    localStorage.setItem("fl_token", data.token);
    localStorage.setItem("token", data.token);
    return data;
  },

  async register(userData) {
    const { data } = await apiClient.post(
      endpoints.AUTH.REGISTER,
      userData
    );
    return data;
  },

  async getCurrentUser() {
    const { data } = await apiClient.get(
      endpoints.AUTH.ME
    );
    return data;
  },

  async me() {
    return this.getCurrentUser();
  },

  logout() {
    localStorage.removeItem("fl_token");
    localStorage.removeItem("fl_user");
    localStorage.removeItem("token");
  },
};
