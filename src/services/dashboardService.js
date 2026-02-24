import apiClient from "./apiClient";
import endpoints from "./endpoints";

export const dashboardService = {
  async getDashboardData() {
    const { data } = await apiClient.get(endpoints.DASHBOARD);
    return data;
  },

  async freelancer() {
    return this.getDashboardData();
  },

  async client() {
    return this.getDashboardData();
  },

  async admin() {
    return this.getDashboardData();
  },
};
