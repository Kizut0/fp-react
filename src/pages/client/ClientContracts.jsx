import { useEffect, useMemo, useState } from "react";
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

const DEFAULT_CREATE = {
  proposalId: "",
  jobId: "",
  jobTitle: "",
  freelancerId: "",
  amount: "",
};

export default function ClientContracts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [creating, setCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(DEFAULT_CREATE);

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

    return items.filter((item) => {
      const status = normalizeStatus(item.status);
      if (statusFilter !== "all" && status !== statusFilter) return false;

      if (!q) return true;

      const fields = [
        item.jobTitle,
        item.jobId,
        item.freelancerId,
        item.freelancerName,
        item.clientId,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");

      return fields.includes(q);
    });
  }, [items, query, statusFilter]);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      if (form.proposalId.trim()) {
        await contractService.create({ proposalId: form.proposalId.trim() });
      } else {
        await contractService.create({
          jobId: form.jobId.trim(),
          jobTitle: form.jobTitle.trim(),
          freelancerId: form.freelancerId.trim(),
          amount: Number(form.amount || 0),
        });
      }

      setForm(DEFAULT_CREATE);
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setCreating(false);
    }
  };

  const completeContract = async (id) => {
    setBusyId(id);
    setError("");
    try {
      await contractService.complete(id);
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusyId("");
    }
  };

  const cancelContract = async (id) => {
    setBusyId(id);
    setError("");
    try {
      await contractService.update(id, { status: "cancelled" });
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
        <div className="h1">Client Contracts</div>
        <div className="muted">Track signed engagements, complete milestones, and keep contract records organized.</div>
      </div>

      <ErrorBox message={error} />

      <div className="card">
        <div className="h2">Create Contract</div>
        <div className="muted" style={{ marginBottom: 12 }}>
          Preferred flow: enter an accepted proposal ID. Manual creation is also supported.
        </div>

        <form className="row" onSubmit={handleCreate}>
          <div className="grid2">
            <div>
              <label className="block mb-1">Proposal ID (optional)</label>
              <input
                className="input"
                value={form.proposalId}
                onChange={(e) => updateForm("proposalId", e.target.value)}
                placeholder="Auto-create from accepted proposal"
              />
            </div>

            <div>
              <label className="block mb-1">Job ID</label>
              <input
                className="input"
                value={form.jobId}
                onChange={(e) => updateForm("jobId", e.target.value)}
                placeholder="Required for manual contract"
                disabled={Boolean(form.proposalId.trim())}
              />
            </div>

            <div>
              <label className="block mb-1">Job Title</label>
              <input
                className="input"
                value={form.jobTitle}
                onChange={(e) => updateForm("jobTitle", e.target.value)}
                placeholder="Optional manual title"
                disabled={Boolean(form.proposalId.trim())}
              />
            </div>

            <div>
              <label className="block mb-1">Freelancer ID</label>
              <input
                className="input"
                value={form.freelancerId}
                onChange={(e) => updateForm("freelancerId", e.target.value)}
                placeholder="Required for manual contract"
                disabled={Boolean(form.proposalId.trim())}
              />
            </div>

            <div>
              <label className="block mb-1">Amount (THB)</label>
              <input
                className="input"
                type="number"
                min="1"
                value={form.amount}
                onChange={(e) => updateForm("amount", e.target.value)}
                placeholder="Required for manual contract"
                disabled={Boolean(form.proposalId.trim())}
              />
            </div>
          </div>

          <div>
            <button type="submit" className="btn btnOk" disabled={creating}>
              {creating ? "Creating..." : "Create Contract"}
            </button>
          </div>
        </form>
      </div>

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
              <th>Freelancer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Start</th>
              <th>End</th>
              <th>Delivery</th>
              <th style={{ width: 220 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((contract) => {
              const id = contract._id || contract.contractId;
              const status = normalizeStatus(contract.status);

              return (
                <tr key={id}>
                  <td>{contract.jobTitle || contract.jobId || "-"}</td>
                  <td>{contract.freelancerName || contract.freelancerId || "-"}</td>
                  <td>{formatMoney(contract.amount)}</td>
                  <td>
                    <span className="badge">{status}</span>
                  </td>
                  <td>{formatDate(contract.startDate)}</td>
                  <td>{formatDate(contract.endDate)}</td>
                  <td>
                    {contract.delivery?.link ? (
                      <div>
                        <a href={contract.delivery.link} target="_blank" rel="noreferrer">
                          Delivery Link
                        </a>
                      </div>
                    ) : null}
                    {contract.delivery?.attachment?.name ? (
                      <div>
                        <a href={contract.delivery.attachment.dataUrl} download={contract.delivery.attachment.name}>
                          {contract.delivery.attachment.name}
                        </a>
                      </div>
                    ) : null}
                    {contract.delivery?.notes ? (
                      <div className="muted" style={{ maxWidth: 240, whiteSpace: "pre-wrap" }}>
                        {contract.delivery.notes}
                      </div>
                    ) : null}
                    {!contract.delivery?.link && !contract.delivery?.attachment?.name && !contract.delivery?.notes ? "-" : null}
                  </td>
                  <td>
                    <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn btnOk"
                        disabled={status !== "active" || busyId === id}
                        onClick={() => completeContract(id)}
                      >
                        Complete
                      </button>

                      <button
                        type="button"
                        className="btn"
                        disabled={status !== "active" || busyId === id}
                        onClick={() => cancelContract(id)}
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="8" className="muted">
                  No contracts found for the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
