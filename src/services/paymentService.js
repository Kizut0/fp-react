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

export const paymentService = {
  async create(paymentData) {
    const { data } = await apiClient.post(endpoints.PAYMENTS, paymentData);
    return data;
  },

  async getAll(query = "") {
    const suffix = toQueryString(query);
    const { data } = await apiClient.get(`${endpoints.PAYMENTS}${suffix}`);
    return data;
  },

  async list(query = "") {
    return this.getAll(query);
  },
};
