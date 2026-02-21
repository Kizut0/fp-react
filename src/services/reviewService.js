import apiClient from "./apiClient";
import endpoints from "./endpoints";

export const reviewService = {
  async create(reviewData) {
    const { data } = await apiClient.post(
      endpoints.REVIEWS,
      reviewData
    );
    return data;
  },

  async getByUser(userId) {
    const { data } = await apiClient.get(
      `${endpoints.REVIEWS}?userId=${userId}`
    );
    return data;
  },
};