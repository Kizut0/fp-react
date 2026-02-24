import apiClient from "./apiClient";
import endpoints from "./endpoints";

function toQueryString(query = "") {
  if (!query) return "";
  if (typeof query === "string") return query ? `?${query}` : "";

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export const reviewService = {
  async create(reviewData) {
    const { data } = await apiClient.post(endpoints.REVIEWS, reviewData);
    return data;
  },

  async list(query = "") {
    const suffix = toQueryString(query);
    const { data } = await apiClient.get(`${endpoints.REVIEWS}${suffix}`);
    return data;
  },

  async getByUser(userId) {
    return this.list({ userId });
  },

  async remove(id) {
    const { data } = await apiClient.delete(`${endpoints.REVIEWS}/${id}`);
    return data;
  },
};
