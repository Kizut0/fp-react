import apiClient from "./apiClient";
import endpoints from "./endpoints";

export const proposalService = {
  async create(proposalData) {
    const { data } = await apiClient.post(
      endpoints.PROPOSALS,
      proposalData
    );
    return data;
  },

  async getByJob(jobId) {
    const { data } = await apiClient.get(
      `${endpoints.PROPOSALS}?jobId=${jobId}`
    );
    return data;
  },

  async accept(id) {
    const { data } = await apiClient.patch(
      `${endpoints.PROPOSALS}/${id}/accept`
    );
    return data;
  },

  async reject(id) {
    const { data } = await apiClient.patch(
      `${endpoints.PROPOSALS}/${id}/reject`
    );
    return data;
  },
};