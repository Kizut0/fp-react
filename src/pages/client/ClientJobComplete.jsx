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

function getMilestones(contract) {
  const milestones = Array.isArray(contract?.milestones) ? contract.milestones : [];
  if (milestones.length > 0) {
    return milestones.map((milestone, index) => ({
      key: normalizeMilestoneKey(milestone?.key || milestone?.milestoneKey || `milestone-${index + 1}`),
      title: String(milestone?.title || `Milestone ${index + 1}`),
      status: String(milestone?.status || "").toLowerCase(),
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
        const pendingChangeOrder =
          changeOrders.find((order) => normalizeChangeOrderStatus(order?.status) === "pending") || null;
        const latestChangeOrder = changeOrders[0] || null;
        if (reqState === "not_submitted" && !pendingChangeOrder) return;

        out.push({
          contractId: String(contractId),
          contractState,
          jobTitle: item.jobTitle || item.jobId || "-",
          freelancer: item.freelancerName || item.freelancerId || "-",
          milestoneKey: milestone.key,
          milestoneTitle: milestone.title || milestone.key,
          milestoneStatus: String(milestone.status || "pending").toLowerCase(),
          completionRequest: milestone.completionRequest || {},
          reqState,
          pendingChangeOrder,
          latestChangeOrder,
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

  if (loading) return <Loading />;

  return (
    <div className="row">
      <div className="card">
        <div className="h1">Job Complete</div>
        <div className="muted">Review freelancer delivery and accept or reject submitted work.</div>
      </div>

      <ErrorBox message={error} />

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Milestone</th>
              <th>Freelancer</th>
              <th>Contract</th>
              <th>Request</th>
              <th>Submitted</th>
              <th>Delivery</th>
              <th>Notes</th>
              <th>Change Order</th>
              <th style={{ width: 280 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const key = `${item.contractId}::${item.milestoneKey}`;
              const pending = item.reqState === "pending";
              const pendingChangeOrderId = String(item.pendingChangeOrder?.id || "").trim();
              const changeOrderBusyKey = `${item.contractId}::${pendingChangeOrderId}::co`;

              return (
                <tr key={key}>
                  <td>{item.jobTitle}</td>
                  <td>
                    {item.milestoneTitle}
                    <div className="muted" style={{ marginTop: 4 }}>
                      key: {item.milestoneKey}
                    </div>
                  </td>
                  <td>{item.freelancer}</td>
                  <td><span className="badge">{item.contractState}</span></td>
                  <td>
                    <span className="badge">{item.reqState.replace("_", " ")}</span>
                    <div className="muted" style={{ marginTop: 4 }}>
                      {item.milestoneStatus.replace("_", " ")}
                    </div>
                  </td>
                  <td>{formatDate(item.completionRequest?.submittedAt)}</td>
                  <td>
                    {item.completionRequest?.link ? (
                      <div>
                        <a href={item.completionRequest.link} target="_blank" rel="noreferrer">
                          Work Link
                        </a>
                      </div>
                    ) : null}
                    {item.completionRequest?.attachment?.name ? (
                      <div>
                        <a
                          href={item.completionRequest.attachment.dataUrl}
                          download={item.completionRequest.attachment.name}
                        >
                          {item.completionRequest.attachment.name}
                        </a>
                      </div>
                    ) : null}
                    {!item.completionRequest?.link && !item.completionRequest?.attachment?.name ? "-" : null}
                  </td>
                  <td style={{ whiteSpace: "pre-wrap" }}>
                    {item.completionRequest?.notes || item.completionRequest?.clientFeedback || "-"}
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
                    <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn btnOk"
                        disabled={!pending || busyKey === key || busyKey === changeOrderBusyKey}
                        onClick={() => decide(item.contractId, item.milestoneKey, "accept")}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="btn btnDanger"
                        disabled={!pending || busyKey === key || busyKey === changeOrderBusyKey}
                        onClick={() => decide(item.contractId, item.milestoneKey, "reject")}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className="btn btnWarn"
                        disabled={!pending || busyKey === key || busyKey === changeOrderBusyKey}
                        onClick={() => dispute(item.contractId, item.milestoneKey)}
                      >
                        Dispute
                      </button>
                      <button
                        type="button"
                        className="btn btnOk"
                        disabled={!pendingChangeOrderId || busyKey === changeOrderBusyKey || busyKey === key}
                        onClick={() => decideChangeOrder(item.contractId, pendingChangeOrderId, "approve")}
                      >
                        Approve Change
                      </button>
                      <button
                        type="button"
                        className="btn btnDanger"
                        disabled={!pendingChangeOrderId || busyKey === changeOrderBusyKey || busyKey === key}
                        onClick={() => decideChangeOrder(item.contractId, pendingChangeOrderId, "reject")}
                      >
                        Reject Change
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="10" className="muted">No completion submissions or pending change orders yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
