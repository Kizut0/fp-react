import apiClient from "./apiClient";
import endpoints from "./endpoints";

export const jobService = {
  async getAll() {
    const { data } = await apiClient.get(endpoints.JOBS);
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