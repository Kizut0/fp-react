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

  async dispute({ paymentId = "", contractId = "", milestoneKey = "", reason = "" } = {}) {
    const { data } = await apiClient.patch(endpoints.PAYMENTS, {
      action: "dispute",
      ...(paymentId ? { paymentId } : {}),
      ...(contractId ? { contractId } : {}),
      ...(milestoneKey ? { milestoneKey } : {}),
      reason,
    });
    return data;
  },

  async resolve({ paymentId = "", contractId = "", milestoneKey = "", resolution = "", note = "" } = {}) {
    const { data } = await apiClient.patch(endpoints.PAYMENTS, {
      action: "resolve",
      ...(paymentId ? { paymentId } : {}),
      ...(contractId ? { contractId } : {}),
      ...(milestoneKey ? { milestoneKey } : {}),
      resolution,
      note,
    });
    return data;
  },

  async addEvidence({ paymentId = "", contractId = "", milestoneKey = "", evidence = [], note = "" } = {}) {
    const { data } = await apiClient.patch(endpoints.PAYMENTS, {
      action: "evidence",
      ...(paymentId ? { paymentId } : {}),
      ...(contractId ? { contractId } : {}),
      ...(milestoneKey ? { milestoneKey } : {}),
      evidence,
      note,
    });
    return data;
  },

  async mediate({ paymentId = "", contractId = "", milestoneKey = "", stage = "", note = "", slaHours } = {}) {
    const { data } = await apiClient.patch(endpoints.PAYMENTS, {
      action: "mediate",
      ...(paymentId ? { paymentId } : {}),
      ...(contractId ? { contractId } : {}),
      ...(milestoneKey ? { milestoneKey } : {}),
      stage,
      note,
      ...(slaHours !== undefined ? { slaHours } : {}),
    });
    return data;
  },

  async remove(id) {
    const { data } = await apiClient.delete(`${endpoints.PAYMENTS}?id=${id}`);
    return data;
  },
};
