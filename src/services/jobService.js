import apiClient from "./apiClient";
import endpoints from "./endpoints";

function buildQueryString(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, rawValue]) => {
    if (rawValue === undefined || rawValue === null) return;

    const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;
    if (value === "" || value === "all") return;

    params.set(key, String(value));
  });

  const query = params.toString();
  return query ? `?${query}` : "";
}

export const jobService = {
  async getAll(filters = {}) {
    const suffix = buildQueryString(filters);
    const { data } = await apiClient.get(`${endpoints.JOBS}${suffix}`);
    return data;
  },

  async getById(id) {
    const { data } = await apiClient.get(`${endpoints.JOBS}/${id}`);
    return data;
  },

  async create(jobData) {
    const { data } = await apiClient.post(endpoints.JOBS, jobData);
    return data;
  },

  async update(id, jobData) {
    const { data } = await apiClient.put(
      `${endpoints.JOBS}/${id}`,
      jobData
    );
    return data;
  },

  async delete(id) {
    const { data } = await apiClient.delete(
      `${endpoints.JOBS}/${id}`
    );
    return data;
  },
};
