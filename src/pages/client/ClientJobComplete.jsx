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
  return String(item?.completionRequest?.status || "not_submitted").toLowerCase();
}

export default function ClientJobComplete() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

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

  const filtered = useMemo(
    () => items.filter((item) => requestStatus(item) !== "not_submitted"),
    [items]
  );

  const decide = async (id, action) => {
    setBusyId(id);
    setError("");
    try {
      const feedback = action === "reject" ? window.prompt("Rejection feedback (optional):", "") || "" : "";
      if (action === "accept") {
        await contractService.acceptCompletion(id, feedback);
        navigate(`/client/payments?contractId=${encodeURIComponent(String(id || ""))}`);
        return;
      } else {
        await contractService.rejectCompletion(id, feedback);
      }
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusyId("");
    }
  };

  const dispute = async (id) => {
    if (!id) return;

    const reason = window.prompt("Dispute reason (min 10 characters):", "") || "";
    if (!reason.trim()) return;

    setBusyId(id);
    setError("");
    try {
      await paymentService.dispute({ contractId: String(id), reason: reason.trim() });
      navigate(`/client/payments?contractId=${encodeURIComponent(String(id || ""))}`);
    } catch (err) {
      setError(err);
    } finally {
      setBusyId("");
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
              <th>Freelancer</th>
              <th>Request</th>
              <th>Submitted</th>
              <th>Delivery</th>
              <th>Notes</th>
              <th style={{ width: 220 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const id = item._id || item.contractId;
              const reqState = requestStatus(item);
              const pending = reqState === "pending";

              return (
                <tr key={id}>
                  <td>{item.jobTitle || item.jobId || "-"}</td>
                  <td>{item.freelancerName || item.freelancerId || "-"}</td>
                  <td><span className="badge">{reqState.replace("_", " ")}</span></td>
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
                  <td>
                    <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn btnOk"
                        disabled={!pending || busyId === id}
                        onClick={() => decide(id, "accept")}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="btn btnDanger"
                        disabled={!pending || busyId === id}
                        onClick={() => decide(id, "reject")}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className="btn btnWarn"
                        disabled={!pending || busyId === id}
                        onClick={() => dispute(id)}
                      >
                        Dispute
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="muted">No completion submissions yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
