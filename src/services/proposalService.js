import apiClient from "./apiClient";
import endpoints from "./endpoints";

export const proposalService = {
  async create(proposalData) {
    const { data } = await apiClient.post(endpoints.PROPOSALS, proposalData);
    return data;
  },

  async list(query = "") {
    const suffix = query ? `?${query}` : "";
    const { data } = await apiClient.get(`${endpoints.PROPOSALS}${suffix}`);
    return data;
  },

  async getByJob(jobId) {
    return this.list(`jobId=${jobId}`);
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
