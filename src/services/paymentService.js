import apiClient from "./apiClient";
import endpoints from "./endpoints";

export const paymentService = {
  async create(paymentData) {
    const { data } = await apiClient.post(
      endpoints.PAYMENTS,
      paymentData
    );
    return data;
  },

  async getAll() {
    const { data } = await apiClient.get(endpoints.PAYMENTS);
    return data;
  },
};