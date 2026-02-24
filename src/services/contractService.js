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

export const contractService = {
  async getAll(query = "") {
    const suffix = toQueryString(query);
    const { data } = await apiClient.get(`${endpoints.CONTRACTS}${suffix}`);
    return data;
  },

  async list(query = "") {
    return this.getAll(query);
  },

  async getById(id) {
    const { data } = await apiClient.get(`${endpoints.CONTRACTS}/${id}`);
    return data;
  },

  async create(payload) {
    const { data } = await apiClient.post(endpoints.CONTRACTS, payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await apiClient.put(`${endpoints.CONTRACTS}/${id}`, payload);
    return data;
  },

  async remove(id) {
    const { data } = await apiClient.delete(`${endpoints.CONTRACTS}/${id}`);
    return data;
  },

  async complete(id, payload = {}) {
    const { data } = await apiClient.patch(`${endpoints.CONTRACTS}/${id}/complete`, payload);
    return data;
  },
};
