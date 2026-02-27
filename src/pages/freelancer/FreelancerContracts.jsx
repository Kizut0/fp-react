import React, { useEffect, useMemo, useState } from "react";
import ErrorBox from "../../components/ErrorBox";
import Loading from "../../components/Loading";
import { contractService } from "../../services/contractService";

function toArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function normalizeStatus(value) {
  return String(value || "active").toLowerCase();
}

export default function FreelancerContracts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [completeId, setCompleteId] = useState("");
  const [activeMilestoneKey, setActiveMilestoneKey] = useState(""); // Add this line
  const [deliveryLink, setDeliveryLink] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [deliveryFile, setDeliveryFile] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");

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

  const stats = useMemo(() => {
    const out = { active: 0, completed: 0, cancelled: 0 };
    for (const item of items) {
      const status = normalizeStatus(item.status);
      if (out[status] !== undefined) out[status] += 1;
    }
    return out;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((contract) => {
      const status = normalizeStatus(contract.status);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!q) return true;

      const fields = [
        contract.jobTitle,
        contract.jobId,
        contract.clientId,
        contract.clientName,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");

      return fields.includes(q);
    });
  }, [items, query, statusFilter]);

  const openCompleteDialog = (contractId, milestoneKey) => {
    setCompleteId(contractId);
    setActiveMilestoneKey(milestoneKey); // Track which milestone we are submitting
    setDeliveryLink("");
    setDeliveryNotes("");
    setDeliveryFile(null);
    setError("");
  };

  const closeCompleteDialog = () => {
    setCompleteId("");
    setActiveMilestoneKey("");
    setDeliveryLink("");
    setDeliveryNotes("");
    setDeliveryFile(null);
  };

  const toAttachment = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          dataUrl: String(reader.result || ""),
        });
      reader.onerror = () => reject(new Error("Failed to read selected file"));
      reader.readAsDataURL(file);
    });

  const completeContract = async (id) => {
    setBusyId(id);
    setError("");

    try {
      const trimmedLink = deliveryLink.trim();
      const trimmedNotes = deliveryNotes.trim();
      let attachment = null;

      if (!trimmedLink && !deliveryFile) {
        throw new Error("Provide at least a delivery file or a delivery link.");
      }

      if (deliveryFile) {
        if (deliveryFile.size > 2_000_000) {
          throw new Error("File must be 2MB or smaller.");
        }
        attachment = await toAttachment(deliveryFile);
      }

      await contractService.actionMilestone(id, {
        action: "submit",
        milestoneKey: activeMilestoneKey,
        deliveryLink: trimmedLink,
        deliveryNotes: trimmedNotes,
        deliveryAttachment: attachment,
      });
      closeCompleteDialog();
      await load();
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
        <div className="h1">Contracts</div>
        <div className="muted">Track active client engagements and mark completed work for payout flow.</div>
      </div>

      <ErrorBox message={error} />

      {completeId && (
        <div className="card">
          <div className="h2">Submit Delivery and Complete Contract</div>
          <div className="muted" style={{ marginBottom: 12 }}>
            Attach a delivery file and/or add a delivery link. Client can view these after completion.
          </div>
          <div className="row">
            <div className="grid2">
              <div>
                <label className="block mb-1">Delivery Link</label>
                <input
                  className="input"
                  type="url"
                  value={deliveryLink}
                  onChange={(e) => setDeliveryLink(e.target.value)}
                  placeholder="https://drive.google.com/... or repo/doc link"
                />
              </div>
              <div>
                <label className="block mb-1">Attach File (max 2MB)</label>
                <input
                  className="input"
                  type="file"
                  onChange={(e) => setDeliveryFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <div>
              <label className="block mb-1">Delivery Notes (optional)</label>
              <textarea
                className="textarea"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="What was delivered, setup instructions, credentials, etc."
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="btn btnOk"
                disabled={busyId === completeId}
                onClick={() => completeContract(completeId)}
              >
                {busyId === completeId ? "Submitting..." : "Complete Contract"}
              </button>
              <button
                type="button"
                className="btn"
                disabled={busyId === completeId}
                onClick={closeCompleteDialog}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex justify-between items-center" style={{ gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
          <div className="muted">
            Total: {items.length} • Active: {stats.active} • Completed: {stats.completed} • Cancelled: {stats.cancelled}
          </div>
          <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
            <input
              className="input"
              placeholder="Search contracts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ minWidth: 220 }}
            />
            <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Start</th>
              <th>End</th>
              <th>Delivery</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((contract) => {
              const id = contract._id || contract.contractId;
              const status = normalizeStatus(contract.status);

              return (
                <React.Fragment key={id}>
                  <tr>
                    <td>{contract.jobTitle || contract.jobId || "-"}</td>
                    <td>{contract.clientName || contract.clientId || "-"}</td>
                    <td>{formatMoney(contract.amount)}</td>
                    <td><span className="badge">{status}</span></td>
                    <td>{formatDate(contract.startDate)}</td>
                    <td>{formatDate(contract.endDate)}</td>
                    <td>-</td>
                    <td>
                      {/* You can remove the main "Complete" button from here since it happens per-milestone now */}
                    </td>
                  </tr>

                  {/* ADD THIS NEW ROW TO SHOW MILESTONES */}
                  <tr style={{ backgroundColor: "#fcfcfc" }}>
                    <td colSpan="8" style={{ paddingLeft: 30 }}>
                      <div className="muted mb-1"><strong>Project Milestones:</strong></div>
                      {(contract.milestones || []).map((m) => (
                        <div key={m.key} className="flex gap-3 items-center mb-1">
                          <span>{m.title} — {formatMoney(m.amount)}</span>
                          <span className="badge">{m.status}</span>

                          {/* Only show Submit Work button if the milestone is pending */}
                          {(m.status === "pending" || m.status === "active") && (
                            <button
                              type="button"
                              className="btn btnOk" style={{ padding: "4px 8px", fontSize: "0.85rem" }}
                              disabled={busyId === id}
                              onClick={() => openCompleteDialog(id, m.key)}
                            >
                              Submit Work
                            </button>
                          )}
                        </div>
                      ))}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="8" className="muted">
                  No contracts found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
