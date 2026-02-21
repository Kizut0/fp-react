import apiClient from "./apiClient";
import endpoints from "./endpoints";

export const adminService = {
  async getAllUsers() {
    const { data } = await apiClient.get(
      endpoints.ADMIN.USERS
    );
    return data;
  },

  async deleteUser(id) {
    const { data } = await apiClient.delete(
      `${endpoints.ADMIN.USERS}/${id}`
    );
    return data;
  },

  async getStats() {
    const { data } = await apiClient.get(
      endpoints.ADMIN.STATS
    );
    return data;
  },
};