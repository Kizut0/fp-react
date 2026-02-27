import { useEffect, useMemo, useState } from "react";
import ErrorBox from "../../components/ErrorBox";
import Loading from "../../components/Loading";
import { contractService } from "../../services/contractService";

function toArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function requestStatus(item) {
  return String(item?.completionRequest?.status || item?.status || "not_submitted").toLowerCase();
}

function normalizeMilestoneKey(value) {
  const key = String(value || "").trim();
  return key || "default";
}

function normalizeChangeOrderStatus(value) {
  return String(value || "pending").trim().toLowerCase();
}

function normalizeEscalationStatus(value) {
  return String(value || "open").trim().toLowerCase();
}

function getMilestoneChangeOrders(contract, milestoneKey) {
  const key = normalizeMilestoneKey(milestoneKey);
  const orders = Array.isArray(contract?.changeOrders) ? contract.changeOrders : [];
  return orders
    .filter((item) => normalizeMilestoneKey(item?.milestoneKey) === key)
    .slice()
    .sort((left, right) => {
      const leftTime = new Date(left?.updatedAt || left?.requestedAt || 0).getTime();
      const rightTime = new Date(right?.updatedAt || right?.requestedAt || 0).getTime();
      return rightTime - leftTime;
    });
}

function getMilestoneEscalations(contract, milestoneKey) {
  const key = normalizeMilestoneKey(milestoneKey);
  const escalations = Array.isArray(contract?.escalations) ? contract.escalations : [];
  return escalations
    .filter((item) => normalizeMilestoneKey(item?.milestoneKey) === key)
    .slice()
    .sort((left, right) => {
      const leftTime = new Date(left?.updatedAt || left?.openedAt || 0).getTime();
      const rightTime = new Date(right?.updatedAt || right?.openedAt || 0).getTime();
      return rightTime - leftTime;
    });
}

function formatSlaLabel(sla = {}) {
  if (!sla || typeof sla !== "object") return "-";
  const dueState = String(sla.dueState || "").toLowerCase();
  if (!sla.dueDate) return "No due date";
  if (dueState === "escalated") {
    return `Escalated - ${Number(sla.overdueDays || 0)}d overdue`;
  }
  if (dueState === "overdue") {
    return `Overdue - ${Number(sla.overdueDays || 0)}d`;
  }
  if (dueState === "due_soon") {
    return `Due soon - ${Number(sla.dueInHours || 0)}h left`;
  }
  if (dueState === "closed") return "Closed";
  return `On track - ${Number(sla.dueInDays || 0)}d left`;
}

function formatDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function getMilestones(contract) {
  const milestones = Array.isArray(contract?.milestones) ? contract.milestones : [];
  if (milestones.length > 0) {
    return milestones.map((milestone, index) => ({
      key: normalizeMilestoneKey(milestone?.key || milestone?.milestoneKey || `milestone-${index + 1}`),
      title: String(milestone?.title || `Milestone ${index + 1}`),
      status: String(milestone?.status || "").toLowerCase(),
      dueDate: milestone?.dueDate || null,
      sla: milestone?.sla || {},
      completionRequest: milestone?.completionRequest || {},
    }));
  }

  return [
    {
      key: normalizeMilestoneKey(contract?.completionRequest?.milestoneKey),
      title: String(
        contract?.completionRequest?.milestoneTitle || contract?.jobTitle || contract?.jobId || "Milestone"
      ),
      status: String(contract?.completionRequest?.milestoneStatus || contract?.status || "pending").toLowerCase(),
      dueDate: null,
      sla: {},
      completionRequest: contract?.completionRequest || {},
    },
  ];
}

export default function FreelancerJobComplete() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [selectedContractId, setSelectedContractId] = useState("");
  const [selectedMilestoneKey, setSelectedMilestoneKey] = useState("");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await contractService.list({ mine: "freelancer" });
      setItems(toArray(data));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => items.filter((item) => String(item.status || "").toLowerCase() !== "cancelled"),
    [items]
  );

  const milestoneRows = useMemo(() => {
    const out = [];
    filtered.forEach((item) => {
      const contractId = item._id || item.contractId;
      if (!contractId) return;

      const contractState = String(item.status || "active").toLowerCase();
      getMilestones(item).forEach((milestone) => {
        const changeOrders = getMilestoneChangeOrders(item, milestone.key);
        const escalations = getMilestoneEscalations(item, milestone.key);
        const openEscalation =
          escalations.find((entry) => normalizeEscalationStatus(entry?.status) === "open") || null;
        const pendingChangeOrder =
          changeOrders.find((order) => normalizeChangeOrderStatus(order?.status) === "pending") || null;
        const latestChangeOrder = changeOrders[0] || null;
        out.push({
          contract: item,
          contractId: String(contractId),
          contractState,
          client: item.clientName || item.clientId || "-",
          jobTitle: item.jobTitle || item.jobId || "-",
          milestone,
          milestoneKey: milestone.key,
          milestoneTitle: milestone.title || milestone.key,
          milestoneState: String(milestone.status || "pending").toLowerCase(),
          milestoneDueDate: milestone.dueDate || null,
          milestoneSla: milestone.sla || {},
          reqState: requestStatus(milestone),
          pendingChangeOrder,
          latestChangeOrder,
          openEscalation,
        });
      });
    });
    return out;
  }, [filtered]);

  const selectedItem = useMemo(
    () =>
      milestoneRows.find(
        (item) =>
          item.contractId === String(selectedContractId || "") &&
          item.milestoneKey === String(selectedMilestoneKey || "")
      ) || null,
    [milestoneRows, selectedContractId, selectedMilestoneKey]
  );
  const selectedRejected = selectedItem?.reqState === "rejected";
  const selectedActionKey =
    selectedContractId && selectedMilestoneKey ? `${selectedContractId}::${selectedMilestoneKey}` : "";

  const toAttachment = (inputFile) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          name: inputFile.name,
          type: inputFile.type || "application/octet-stream",
          size: inputFile.size,
          dataUrl: String(reader.result || ""),
        });
      reader.onerror = () => reject(new Error("Failed to read selected file"));
      reader.readAsDataURL(inputFile);
    });

  const submit = async () => {
    if (!selectedContractId || !selectedMilestoneKey) return;

    setBusyKey(selectedActionKey);
    setError("");
    try {
      const trimmedLink = link.trim();
      const trimmedNotes = notes.trim();
      let attachment = null;
      const previousState = selectedItem?.reqState || "not_submitted";

      if (!trimmedLink && !file) {
        throw new Error("Provide at least one delivery link or attachment.");
      }

      if (previousState === "rejected" && !trimmedNotes) {
        throw new Error("Client rejected this work. Please fill revision notes before resubmitting.");
      }

      if (file) {
        if (file.size > 2_000_000) throw new Error("Attachment must be 2MB or smaller.");
        attachment = await toAttachment(file);
      }

      await contractService.submitCompletion(selectedContractId, {
        milestoneKey: selectedMilestoneKey,
        deliveryLink: trimmedLink,
        deliveryNotes: trimmedNotes,
        deliveryAttachment: attachment,
      });

      setSelectedContractId("");
      setSelectedMilestoneKey("");
      setLink("");
      setNotes("");
      setFile(null);
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusyKey("");
    }
  };

  const requestChangeOrder = async (item) => {
    if (!item?.contractId || !item?.milestoneKey) return;
    const actionKey = `${item.contractId}::${item.milestoneKey}::co-request`;

    const reason = window.prompt("Change-order reason (minimum 10 characters):", "") || "";
    if (!reason.trim()) return;

    try {
      const currentTitle = String(item?.milestone?.title || "").trim();
      const currentDescription = String(item?.milestone?.description || "").trim();
      const currentAmount = Number(item?.milestone?.amount || 0);
      const currentDueDate = formatDateInput(item?.milestone?.dueDate);

      const nextTitleInput = window.prompt("Milestone title (keep or edit):", currentTitle);
      if (nextTitleInput === null) return;
      const nextDescriptionInput = window.prompt(
        "Milestone description (keep or edit):",
        currentDescription
      );
      if (nextDescriptionInput === null) return;
      const nextAmountInput = window.prompt(
        "Milestone amount (keep or edit):",
        currentAmount > 0 ? String(currentAmount) : ""
      );
      if (nextAmountInput === null) return;
      const nextDueDateInput = window.prompt(
        "Milestone due date YYYY-MM-DD (keep or edit):",
        currentDueDate
      );
      if (nextDueDateInput === null) return;

      const changes = {};
      const nextTitle = String(nextTitleInput || "").trim();
      if (!nextTitle && currentTitle) {
        throw new Error("Milestone title cannot be empty.");
      }
      if (nextTitle && nextTitle !== currentTitle) changes.title = nextTitle;

      const nextDescription = String(nextDescriptionInput || "").trim();
      if (nextDescription !== currentDescription) changes.description = nextDescription;

      const amountRaw = String(nextAmountInput || "").trim();
      if (amountRaw) {
        const nextAmount = Number(amountRaw);
        if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
          throw new Error("Milestone amount must be greater than 0.");
        }
        if (nextAmount !== currentAmount) changes.amount = nextAmount;
      }

      const nextDueDate = String(nextDueDateInput || "").trim();
      if (nextDueDate && nextDueDate !== currentDueDate) {
        const parsed = new Date(nextDueDate);
        if (Number.isNaN(parsed.getTime())) {
          throw new Error("Due date must be a valid date in YYYY-MM-DD format.");
        }
        changes.dueDate = nextDueDate;
      }

      if (!Object.keys(changes).length) {
        throw new Error("Provide at least one changed field before submitting a change order.");
      }

      setBusyKey(actionKey);
      setError("");
      await contractService.requestChangeOrder(item.contractId, {
        milestoneKey: item.milestoneKey,
        reason: reason.trim(),
        changes,
      });
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusyKey("");
    }
  };

  const cancelPendingChangeOrder = async (item) => {
    const changeOrderId = String(item?.pendingChangeOrder?.id || "").trim();
    if (!item?.contractId || !changeOrderId) return;
    if (!window.confirm("Cancel this pending change-order request?")) return;

    const actionKey = `${item.contractId}::${item.milestoneKey}::co-cancel`;
    const note = window.prompt("Cancellation note (optional):", "") || "";
    setBusyKey(actionKey);
    setError("");
    try {
      await contractService.cancelChangeOrder(item.contractId, changeOrderId, note.trim());
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusyKey("");
    }
  };

  const openEscalation = async (item) => {
    if (!item?.contractId || !item?.milestoneKey) return;
    const reason = window.prompt("Escalation reason (minimum 10 characters):", "") || "";
    if (!reason.trim()) return;

    const actionKey = `${item.contractId}::${item.milestoneKey}::esc-open`;
    setBusyKey(actionKey);
    setError("");
    try {
      await contractService.openEscalation(item.contractId, {
        milestoneKey: item.milestoneKey,
        reason: reason.trim(),
        level: String(item.milestoneSla?.breachLevel || "").toLowerCase() === "critical" ? "critical" : "warning",
      });
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusyKey("");
    }
  };

  const cancelEscalation = async (item) => {
    const escalationId = String(item?.openEscalation?.id || item?.milestoneSla?.escalationId || "").trim();
    if (!item?.contractId || !item?.milestoneKey || !escalationId) return;
    if (!window.confirm("Cancel this escalation?")) return;

    const note = window.prompt("Cancellation note (optional):", "") || "";
    const actionKey = `${item.contractId}::${item.milestoneKey}::esc-cancel`;
    setBusyKey(actionKey);
    setError("");
    try {
      await contractService.cancelEscalation(item.contractId, escalationId, note.trim());
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusyKey("");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="row">
      <div className="card">
        <div className="h1">Job Complete</div>
        <div className="muted">Submit your completed work with attachment/link. Client will accept or reject.</div>
      </div>

      <ErrorBox message={error} />

      {selectedContractId && selectedMilestoneKey && (
        <div className="card">
          <div className="h2">Submit Completed Work</div>
          <div className="muted" style={{ marginBottom: 10 }}>
            {selectedItem?.jobTitle || "Job"} - {selectedItem?.milestoneTitle || "Milestone"}
          </div>
          {selectedRejected && (
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-3">
              Client rejected your previous submission.
              {selectedItem?.milestone?.completionRequest?.clientFeedback
                ? ` Reason: ${selectedItem.milestone.completionRequest.clientFeedback}`
                : " Please add revision details in Notes before submitting again."}
            </div>
          )}
          <div className="grid2">
            <div>
              <label className="block mb-1">Work Link</label>
              <input
                className="input"
                type="url"
                placeholder="https://..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1">Attachment (max 2MB)</label>
              <input className="input" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
              <label className="block mb-1">
                {selectedRejected ? "Revision Notes (required)" : "Notes (optional)"}
              </label>
              <textarea
                className="textarea"
                placeholder={selectedRejected
                  ? "Explain what you fixed based on client feedback."
                  : "Explain what was delivered and how to verify it."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          <div className="flex gap-3" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn btnOk"
              disabled={busyKey === selectedActionKey || (selectedRejected && !notes.trim())}
              onClick={submit}
            >
              {busyKey === selectedActionKey
                ? "Submitting..."
                : selectedRejected
                  ? "Resubmit for Client Review"
                  : "Submit for Client Review"}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busyKey === selectedActionKey}
              onClick={() => {
                setSelectedContractId("");
                setSelectedMilestoneKey("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Milestone</th>
              <th>Client</th>
              <th>Contract</th>
              <th>Milestone State</th>
              <th>Request</th>
              <th>Due</th>
              <th>SLA</th>
              <th>Submitted</th>
              <th>Client Feedback</th>
              <th>Escalation</th>
              <th>Change Order</th>
              <th style={{ width: 380 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {milestoneRows.map((item) => {
              const actionKey = `${item.contractId}::${item.milestoneKey}`;
              const changeOrderBusy = busyKey.startsWith(`${actionKey}::co-`);
              const escalationBusy = busyKey.startsWith(`${actionKey}::esc-`);
              const rowBusy = busyKey === actionKey || changeOrderBusy || escalationBusy;
              const canSubmit =
                item.contractState === "active" &&
                item.milestoneState !== "released" &&
                item.milestoneState !== "cancelled" &&
                item.reqState !== "pending";
              const canRequestChange =
                item.contractState === "active" &&
                item.milestoneState !== "released" &&
                item.milestoneState !== "cancelled" &&
                item.reqState !== "pending" &&
                !item.pendingChangeOrder;
              const openEscalationId = String(item.openEscalation?.id || item.milestoneSla?.escalationId || "").trim();
              const canEscalate =
                item.contractState === "active" &&
                item.milestoneState !== "released" &&
                item.milestoneState !== "cancelled" &&
                item.milestoneSla?.isOverdue &&
                !openEscalationId;
              const submitLabel = item.reqState === "rejected" ? "Resubmit Work" : "Submit Work";
              return (
                <tr key={actionKey}>
                  <td>{item.jobTitle}</td>
                  <td>
                    {item.milestoneTitle}
                    <div className="muted" style={{ marginTop: 4 }}>
                      key: {item.milestoneKey}
                    </div>
                  </td>
                  <td>{item.client}</td>
                  <td><span className="badge">{item.contractState}</span></td>
                  <td><span className="badge">{item.milestoneState.replace("_", " ")}</span></td>
                  <td><span className="badge">{item.reqState.replace("_", " ")}</span></td>
                  <td>{formatDate(item.milestoneDueDate)}</td>
                  <td>
                    <span className="badge">{formatSlaLabel(item.milestoneSla)}</span>
                  </td>
                  <td>{formatDate(item.milestone?.completionRequest?.submittedAt)}</td>
                  <td style={{ whiteSpace: "pre-wrap" }}>{item.milestone?.completionRequest?.clientFeedback || "-"}</td>
                  <td style={{ whiteSpace: "pre-wrap" }}>
                    {openEscalationId ? (
                      <>
                        <span className="badge">
                          {normalizeEscalationStatus(item.openEscalation?.status)} - {item.openEscalation?.level || "warning"}
                        </span>
                        <div className="muted" style={{ marginTop: 4 }}>
                          {item.openEscalation?.reason || "-"}
                        </div>
                      </>
                    ) : item.milestoneSla?.escalationEligible ? (
                      <span className="badge">Eligible</span>
                    ) : "-"}
                  </td>
                  <td style={{ whiteSpace: "pre-wrap" }}>
                    {item.latestChangeOrder ? (
                      <>
                        <span className="badge">
                          {normalizeChangeOrderStatus(item.latestChangeOrder.status).replace("_", " ")}
                        </span>
                        <div className="muted" style={{ marginTop: 4 }}>
                          {item.latestChangeOrder.reason || "-"}
                        </div>
                      </>
                    ) : "-"}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btnOk"
                      disabled={!canSubmit || rowBusy}
                      onClick={() => {
                        setSelectedContractId(item.contractId);
                        setSelectedMilestoneKey(item.milestoneKey);
                        setLink("");
                        setNotes("");
                        setFile(null);
                      }}
                    >
                      {submitLabel}
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{ marginLeft: 8 }}
                      disabled={!canRequestChange || rowBusy}
                      onClick={() => requestChangeOrder(item)}
                    >
                      Request Change
                    </button>
                    {item.pendingChangeOrder ? (
                      <button
                        type="button"
                        className="btn btnWarn"
                        style={{ marginLeft: 8 }}
                        disabled={rowBusy}
                        onClick={() => cancelPendingChangeOrder(item)}
                      >
                        Cancel Change
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="btn btnWarn"
                      style={{ marginLeft: 8 }}
                      disabled={!canEscalate || rowBusy}
                      onClick={() => openEscalation(item)}
                    >
                      Escalate
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{ marginLeft: 8 }}
                      disabled={!openEscalationId || rowBusy}
                      onClick={() => cancelEscalation(item)}
                    >
                      Cancel Esc.
                    </button>
                  </td>
                </tr>
              );
            })}
            {milestoneRows.length === 0 && (
              <tr>
                <td colSpan="13" className="muted">No milestones available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
