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

  async submitCompletion(id, payload) {
    const { data } = await apiClient.patch(`${endpoints.CONTRACTS}/${id}/completion`, {
      action: "submit",
      ...payload,
    });
    return data;
  },

  async acceptCompletion(id, feedback = "", milestoneKey = "") {
    const { data } = await apiClient.patch(`${endpoints.CONTRACTS}/${id}/completion`, {
      action: "accept",
      feedback,
      ...(milestoneKey ? { milestoneKey } : {}),
    });
    return data;
  },

  async rejectCompletion(id, feedback = "", milestoneKey = "") {
    const { data } = await apiClient.patch(`${endpoints.CONTRACTS}/${id}/completion`, {
      action: "reject",
      feedback,
      ...(milestoneKey ? { milestoneKey } : {}),
    });
    return data;
  },

  async openDispute(id, reason, milestoneKey = "") {
    const { data } = await apiClient.patch(`${endpoints.CONTRACTS}/${id}/dispute`, {
      action: "open",
      reason,
      ...(milestoneKey ? { milestoneKey } : {}),
    });
    return data;
  },

  async resolveDispute(id, decision, resolutionNote = "", milestoneKey = "") {
    const { data } = await apiClient.patch(`${endpoints.CONTRACTS}/${id}/dispute`, {
      action: "resolve",
      decision,
      resolutionNote,
      ...(milestoneKey ? { milestoneKey } : {}),
    });
    return data;
  },

  async requestChangeOrder(id, payload) {
    const { data } = await apiClient.patch(`${endpoints.CONTRACTS}/${id}/change-orders`, {
      action: "request",
      ...payload,
    });
    return data;
  },

  async approveChangeOrder(id, changeOrderId, decisionNote = "") {
    const { data } = await apiClient.patch(`${endpoints.CONTRACTS}/${id}/change-orders`, {
      action: "approve",
      changeOrderId,
      decisionNote,
    });
    return data;
  },

  async rejectChangeOrder(id, changeOrderId, decisionNote = "") {
    const { data } = await apiClient.patch(`${endpoints.CONTRACTS}/${id}/change-orders`, {
      action: "reject",
      changeOrderId,
      decisionNote,
    });
    return data;
  },

  async cancelChangeOrder(id, changeOrderId, decisionNote = "") {
    const { data } = await apiClient.patch(`${endpoints.CONTRACTS}/${id}/change-orders`, {
      action: "cancel",
      changeOrderId,
      decisionNote,
    });
    return data;
  },

  async openEscalation(id, payload = {}) {
    const { data } = await apiClient.patch(`${endpoints.CONTRACTS}/${id}/escalations`, {
      action: "open",
      ...payload,
    });
    return data;
  },

  async resolveEscalation(id, escalationId, resolutionNote = "") {
    const { data } = await apiClient.patch(`${endpoints.CONTRACTS}/${id}/escalations`, {
      action: "resolve",
      escalationId,
      resolutionNote,
    });
    return data;
  },

  async cancelEscalation(id, escalationId, resolutionNote = "") {
    const { data } = await apiClient.patch(`${endpoints.CONTRACTS}/${id}/escalations`, {
      action: "cancel",
      escalationId,
      resolutionNote,
    });
    return data;
  },
};
