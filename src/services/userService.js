import apiClient from "./apiClient";
import endpoints from "./endpoints";

export const userService = {
  async getById(id) {
    const { data } = await apiClient.get(`${endpoints.USERS}/${id}`);
    return data;
  },
};
