import apiClient from "./apiClient";
import endpoints from "./endpoints";

export const reviewService = {
  async create(reviewData) {
    const { data } = await apiClient.post(endpoints.REVIEWS, reviewData);
    return data;
  },

  async list(query = "") {
    const suffix = query ? `?${query}` : "";
    const { data } = await apiClient.get(`${endpoints.REVIEWS}${suffix}`);
    return data;
  },

  async getByUser(userId) {
    return this.list(`userId=${userId}`);
  },

  async remove(id) {
    const { data } = await apiClient.delete(`${endpoints.REVIEWS}/${id}`);
    return data;
  },
};
