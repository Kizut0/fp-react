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

export const proposalService = {
  async create(proposalData) {
    const { data } = await apiClient.post(endpoints.PROPOSALS, proposalData);
    return data;
  },

  async list(query = "") {
    const suffix = toQueryString(query);
    const { data } = await apiClient.get(`${endpoints.PROPOSALS}${suffix}`);
    return data;
  },

  async getById(id) {
    const { data } = await apiClient.get(`${endpoints.PROPOSALS}/${id}`);
    return data;
  },

  async getByJob(jobId) {
    return this.list({ jobId });
  },

  async update(id, proposalData) {
    const { data } = await apiClient.put(`${endpoints.PROPOSALS}/${id}`, proposalData);
    return data;
  },

  async accept(id) {
    const { data } = await apiClient.patch(`${endpoints.PROPOSALS}/${id}/accept`);
    return data;
  },

  async reject(id) {
    const { data } = await apiClient.patch(`${endpoints.PROPOSALS}/${id}/reject`);
    return data;
  },

  async remove(id) {
    const { data } = await apiClient.delete(`${endpoints.PROPOSALS}/${id}`);
    return data;
  },
};
