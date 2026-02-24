import apiClient from "./apiClient";
import endpoints from "./endpoints";

export const adminService = {
  users: {
    async list() {
      const { data } = await apiClient.get(endpoints.ADMIN.USERS);
      return data;
    },
    async update(id, payload) {
      const { data } = await apiClient.patch(endpoints.ADMIN.USERS, {
        id,
        ...payload,
      });
      return data;
    },
    async remove(id) {
      const { data } = await apiClient.delete(`${endpoints.ADMIN.USERS}/${id}`);
      return data;
    },
  },

  jobs: {
    async list() {
      const { data } = await apiClient.get(endpoints.JOBS);
      return data;
    },
  },

  proposals: {
    async list() {
      const { data } = await apiClient.get(endpoints.PROPOSALS);
      return data;
    },
  },

  contracts: {
    async list() {
      const { data } = await apiClient.get(endpoints.CONTRACTS);
      return data;
    },
  },

  reviews: {
    async list() {
      const { data } = await apiClient.get(endpoints.REVIEWS);
      return data;
    },
  },

  payments: {
    async list() {
      const { data } = await apiClient.get(endpoints.PAYMENTS);
      return data;
    },
  },

  async dashboard() {
    const { data } = await apiClient.get(endpoints.ADMIN.STATS);
    return data;
  },

  // backward compatibility
  async getAllUsers() {
    return this.users.list();
  },
  async deleteUser(id) {
    return this.users.remove(id);
  },
  async getStats() {
    return this.dashboard();
  },
};
