import apiClient from "./apiClient";
import endpoints from "./endpoints";

export const contractService = {
  async getAll() {
    const { data } = await apiClient.get(endpoints.CONTRACTS);
    return data;
  },

  async complete(id) {
    const { data } = await apiClient.patch(
      `${endpoints.CONTRACTS}/${id}/complete`
    );
    return data;
  },
};