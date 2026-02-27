import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorBox from "../../components/ErrorBox";
import Loading from "../../components/Loading";
import { contractService } from "../../services/contractService";
import { paymentService } from "../../services/paymentService";

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

export default function ClientJobComplete() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await contractService.list({ mine: "client" });
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

  const filtered = useMemo(() => {
    const out = [];

    items.forEach((item) => {
      const contractId = item._id || item.contractId;
      if (!contractId) return;

      const contractState = String(item.status || "active").toLowerCase();
      getMilestones(item).forEach((milestone) => {
        const reqState = requestStatus(milestone);
        const changeOrders = getMilestoneChangeOrders(item, milestone.key);
        const escalations = getMilestoneEscalations(item, milestone.key);
        const openEscalation =
          escalations.find((entry) => normalizeEscalationStatus(entry?.status) === "open") || null;
        const pendingChangeOrder =
          changeOrders.find((order) => normalizeChangeOrderStatus(order?.status) === "pending") || null;
        const latestChangeOrder = changeOrders[0] || null;
        if (
          reqState === "not_submitted" &&
          !pendingChangeOrder &&
          !milestone?.sla?.isOverdue &&
          !openEscalation
        ) {
          return;
        }

        out.push({
          contractId: String(contractId),
          contractState,
          jobTitle: item.jobTitle || item.jobId || "-",
          freelancer: item.freelancerName || item.freelancerId || "-",
          milestoneKey: milestone.key,
          milestoneTitle: milestone.title || milestone.key,
          milestoneStatus: String(milestone.status || "pending").toLowerCase(),
          milestoneDueDate: milestone.dueDate || null,
          milestoneSla: milestone.sla || {},
          completionRequest: milestone.completionRequest || {},
          reqState,
          pendingChangeOrder,
          latestChangeOrder,
          openEscalation,
        });
      });
    });

    return out;
  }, [items]);

  const decide = async (contractId, milestoneKey, action) => {
    const actionKey = `${contractId}::${milestoneKey}`;
    setBusyKey(actionKey);
    setError("");
    try {
      const feedback = action === "reject" ? window.prompt("Rejection feedback (optional):", "") || "" : "";
      if (action === "accept") {
        await contractService.acceptCompletion(contractId, feedback, milestoneKey);
        navigate(
          `/client/payments?contractId=${encodeURIComponent(
            String(contractId || "")
          )}&milestoneKey=${encodeURIComponent(String(milestoneKey || ""))}`
        );
        return;
      } else {
        await contractService.rejectCompletion(contractId, feedback, milestoneKey);
      }
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusyKey("");
    }
  };

  const dispute = async (contractId, milestoneKey) => {
    if (!contractId) return;

    const reason = window.prompt("Dispute reason (min 10 characters):", "") || "";
    if (!reason.trim()) return;

    const actionKey = `${contractId}::${milestoneKey}`;
    setBusyKey(actionKey);
    setError("");
    try {
      await paymentService.dispute({
        contractId: String(contractId),
        milestoneKey: String(milestoneKey || ""),
        reason: reason.trim(),
      });
      navigate(
        `/client/payments?contractId=${encodeURIComponent(
          String(contractId || "")
        )}&milestoneKey=${encodeURIComponent(String(milestoneKey || ""))}`
      );
    } catch (err) {
      setError(err);
    } finally {
      setBusyKey("");
    }
  };

  const decideChangeOrder = async (contractId, changeOrderId, action) => {
    const actionKey = `${contractId}::${changeOrderId}::co`;
    setBusyKey(actionKey);
    setError("");
    try {
      const notePrompt =
        action === "approve"
          ? "Approval note (optional):"
          : "Rejection reason (optional):";
      const decisionNote = window.prompt(notePrompt, "") || "";

      if (action === "approve") {
        await contractService.approveChangeOrder(contractId, changeOrderId, decisionNote);
      } else {
        await contractService.rejectChangeOrder(contractId, changeOrderId, decisionNote);
      }
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusyKey("");
    }
  };

  const openEscalation = async (contractId, milestoneKey, milestoneSla = {}) => {
    const reason = window.prompt("Escalation reason (minimum 10 characters):", "") || "";
    if (!reason.trim()) return;

    const actionKey = `${contractId}::${milestoneKey}::esc-open`;
    setBusyKey(actionKey);
    setError("");
    try {
      await contractService.openEscalation(contractId, {
        milestoneKey,
        reason: reason.trim(),
        level: String(milestoneSla?.breachLevel || "").toLowerCase() === "critical" ? "critical" : "warning",
      });
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusyKey("");
    }
  };

  const resolveEscalation = async (contractId, milestoneKey, escalationId) => {
    const resolutionNote = window.prompt("Resolution note (optional):", "") || "";
    const actionKey = `${contractId}::${milestoneKey}::esc-resolve`;
    setBusyKey(actionKey);
    setError("");
    try {
      await contractService.resolveEscalation(contractId, escalationId, resolutionNote.trim());
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusyKey("");
    }
  };

  const cancelEscalation = async (contractId, milestoneKey, escalationId) => {
    if (!window.confirm("Cancel this escalation?")) return;
    const note = window.prompt("Cancellation note (optional):", "") || "";
    const actionKey = `${contractId}::${milestoneKey}::esc-cancel`;
    setBusyKey(actionKey);
    setError("");
    try {
      await contractService.cancelEscalation(contractId, escalationId, note.trim());
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
      <div className="card shadow-sm mb-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="h1">Review Deliverables</div>
            <div className="muted">Review freelancer delivery and accept or reject submitted work.</div>
          </div>
          <button className="btn btnOk" onClick={load}>Refresh List</button>
        </div>
      </div>

      <ErrorBox message={error} />

      <div className="grid gap-4">
        {filtered.map((item) => {
          const key = `${item.contractId}::${item.milestoneKey}`;
          const isPending = item.reqState === "pending";
          const pendingChangeOrderId = String(item.pendingChangeOrder?.id || "").trim();
          const changeOrderBusyKey = `${item.contractId}::${pendingChangeOrderId}::co`;
          const openEscalationId = String(item.openEscalation?.id || item.milestoneSla?.escalationId || "").trim();
          const escalationBusy = busyKey.startsWith(`${item.contractId}::${item.milestoneKey}::esc-`);
          const canEscalate =
            item.contractState === "active" &&
            item.milestoneStatus !== "released" &&
            item.milestoneStatus !== "cancelled" &&
            item.milestoneSla?.isOverdue &&
            !openEscalationId;

          return (
            <div key={key} className="card hover-shadow transition-all border-l-4"
              style={{ borderLeftColor: isPending ? 'var(--warn)' : 'var(--success)' }}>

              {/* Header: Identity */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="badge mb-2" style={{ backgroundColor: 'rgba(0,0,0,0.05)', color: '#666' }}>
                    Job: {item.jobTitle}
                  </span>
                  <div className="h2">{item.milestoneTitle}</div>
                  <div className="muted small">Freelancer: {item.freelancer}</div>
                </div>
                <div className="text-right">
                  <span className={`badge ${isPending ? 'btnWarn' : 'btnOk'}`}>
                    {item.reqState.replace("_", " ").toUpperCase()}
                  </span>
                  <div className="muted small mt-2">Key: {item.milestoneKey}</div>
                </div>
              </div>

              {/* Data Grid: Dates and Assets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-y py-4 my-4">
                <div>
                  <div className="muted small uppercase font-bold mb-1">Submitted At</div>
                  <div>{formatDate(item.completionRequest?.submittedAt)}</div>
                </div>
                <div>
                  <div className="muted small uppercase font-bold mb-1">SLA Status</div>
                  <div className={`font-bold ${item.milestoneSla?.isOverdue ? 'text-danger' : 'text-success'}`}>
                    {formatSlaLabel(item.milestoneSla)}
                  </div>
                </div>
                <div>
                  <div className="muted small uppercase font-bold mb-1">Work Delivery</div>
                  <div className="flex flex-wrap gap-3">
                    {item.completionRequest?.link && (
                      <a href={item.completionRequest.link} target="_blank" rel="noreferrer" className="text-primary font-bold">
                        View Work Link
                      </a>
                    )}
                    {item.completionRequest?.attachment?.name && (
                      <a href={item.completionRequest.attachment.dataUrl} download={item.completionRequest.attachment.name} className="text-success font-bold">
                        📎 {item.completionRequest.attachment.name}
                      </a>
                    )}
                    {!item.completionRequest?.link && !item.completionRequest?.attachment?.name && <span className="muted">No assets provided</span>}
                  </div>
                </div>
              </div>

              {/* Context Sections: Notes and Flags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="muted small uppercase font-bold mb-2">Freelancer Notes</div>
                  <div className="bg-light p-3 rounded italic text-secondary min-h-[60px]" style={{ whiteSpace: "pre-wrap" }}>
                    {item.completionRequest?.notes || item.completionRequest?.clientFeedback || "No additional notes."}
                  </div>
                </div>

                <div>
                  <div className="muted small uppercase font-bold mb-2">Management Flags</div>
                  <div className="flex flex-col gap-2">
                    {openEscalationId ? (
                      <div className="badge btnDanger w-fit">
                        Escalation: {item.openEscalation?.level || "warning"} ({item.openEscalation?.reason})
                      </div>
                    ) : item.milestoneSla?.escalationEligible ? (
                      <div className="badge btnWarn w-fit text-black">Overdue: Eligible for Escalation</div>
                    ) : null}

                    {item.latestChangeOrder ? (
                      <div className="badge btnWarn w-fit text-black">
                        Change Order: {normalizeChangeOrderStatus(item.latestChangeOrder.status)}
                      </div>
                    ) : null}
                    {!openEscalationId && !item.latestChangeOrder && !item.milestoneSla?.escalationEligible && <span className="muted">No active issues.</span>}
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap gap-2 justify-end pt-4 border-t">
                {/* Completion Actions */}
                <button
                  type="button"
                  className="btn btnDanger"
                  disabled={!isPending || busyKey === key || escalationBusy}
                  onClick={() => decide(item.contractId, item.milestoneKey, "reject")}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="btn btnOk"
                  disabled={!isPending || busyKey === key || escalationBusy}
                  onClick={() => decide(item.contractId, item.milestoneKey, "accept")}
                >
                  Accept & Pay
                </button>
                <button
                  type="button"
                  className="btn btnWarn"
                  style={{ color: 'black' }}
                  disabled={!isPending || busyKey === key || escalationBusy}
                  onClick={() => dispute(item.contractId, item.milestoneKey)}
                >
                  Dispute
                </button>

                {/* Change Order Block */}
                {pendingChangeOrderId && (
                  <div className="flex gap-2 ml-4 pl-4 border-l">
                    <button
                      type="button"
                      className="btn btnOk"
                      disabled={busyKey === changeOrderBusyKey}
                      onClick={() => decideChangeOrder(item.contractId, pendingChangeOrderId, "approve")}
                    >
                      Approve Change
                    </button>
                    <button
                      type="button"
                      className="btn btnDanger"
                      disabled={busyKey === changeOrderBusyKey}
                      onClick={() => decideChangeOrder(item.contractId, pendingChangeOrderId, "reject")}
                    >
                      Reject Change
                    </button>
                  </div>
                )}

                {/* Escalation Block */}
                <div className="flex gap-2 ml-4 pl-4 border-l">
                  {canEscalate && (
                    <button
                      type="button"
                      className="btn btnWarn"
                      style={{ color: 'black' }}
                      disabled={escalationBusy}
                      onClick={() => openEscalation(item.contractId, item.milestoneKey, item.milestoneSla)}
                    >
                      Escalate
                    </button>
                  )}
                  {openEscalationId && (
                    <>
                      <button
                        type="button"
                        className="btn btnOk"
                        disabled={escalationBusy}
                        onClick={() => resolveEscalation(item.contractId, item.milestoneKey, openEscalationId)}
                      >
                        Resolve Esc.
                      </button>
                      <button
                        type="button"
                        className="btn"
                        disabled={escalationBusy}
                        onClick={() => cancelEscalation(item.contractId, item.milestoneKey, openEscalationId)}
                      >
                        Cancel Esc.
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="card text-center py-12 bg-light">
            <div className="h2 muted">No Pending Submissions</div>
            <p className="muted mt-2">All deliverables are currently up to date or waiting for freelancer submission.</p>
          </div>
        )}
      </div>
    </div>
  );
}