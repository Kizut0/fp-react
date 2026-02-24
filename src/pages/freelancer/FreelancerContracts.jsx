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
    currency: "USD",
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

  if (loading) return <Loading />;

  return (
    <div className="row">
      <div className="card">
        <div className="h1">Contracts</div>
        <div className="muted">Track active client engagements and mark completed work for payout flow.</div>
      </div>

      <ErrorBox message={error} />

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
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((contract) => {
              const id = contract._id || contract.contractId;
              const status = normalizeStatus(contract.status);

              return (
                <tr key={id}>
                  <td>{contract.jobTitle || contract.jobId || "-"}</td>
                  <td>{contract.clientName || contract.clientId || "-"}</td>
                  <td>{formatMoney(contract.amount)}</td>
                  <td>
                    <span className="badge">{status}</span>
                  </td>
                  <td>{formatDate(contract.startDate)}</td>
                  <td>{formatDate(contract.endDate)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btnOk"
                      disabled={status !== "active" || busyId === id}
                      onClick={() => completeContract(id)}
                    >
                      {busyId === id ? "Working..." : "Complete"}
                    </button>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="muted">
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
