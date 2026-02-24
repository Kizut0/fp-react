import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { contractService } from "../../services/contractService";
import ErrorBox from "../../components/ErrorBox";
import Loading from "../../components/Loading";
import { proposalService } from "../../services/proposalService";

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
  return String(value || "submitted").toLowerCase();
}

export default function ClientProposals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyId, setBusyId] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await proposalService.list({ mine: "client" });
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
    const q = query.trim().toLowerCase();

    let rows = items.filter((item) => {
      if (statusFilter !== "all" && normalizeStatus(item.status) !== statusFilter) return false;

      if (!q) return true;

      const fields = [
        item.jobTitle,
        item.jobId,
        item.freelancerName,
        item.freelancerId,
        item.message,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");

      return fields.includes(q);
    });

    rows = rows.slice().sort((a, b) => {
      if (sort === "oldest") return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      if (sort === "bidHigh") return Number(b.price || 0) - Number(a.price || 0);
      if (sort === "bidLow") return Number(a.price || 0) - Number(b.price || 0);
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return rows;
  }, [items, query, sort, statusFilter]);

  const counts = useMemo(() => {
    const initial = { submitted: 0, accepted: 0, rejected: 0, withdrawn: 0 };
    for (const item of items) {
      const status = normalizeStatus(item.status);
      if (initial[status] !== undefined) initial[status] += 1;
    }
    return initial;
  }, [items]);

  const handleAccept = async (id) => {
    setBusyId(id);
    setError("");
    try {
      await proposalService.accept(id);
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusyId("");
    }
  };

  const handleReject = async (id) => {
    setBusyId(id);
    setError("");
    try {
      await proposalService.reject(id);
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusyId("");
    }
  };

  const createContract = async (proposalId) => {
    setBusyId(proposalId);
    setError("");
    try {
      await contractService.create({ proposalId });
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
        <div className="h1">Client Proposals</div>
        <div className="muted">Review freelancer bids, compare pricing, and convert accepted proposals into contracts.</div>
      </div>

      <ErrorBox message={error} />

      <div className="card">
        <div className="flex justify-between items-center" style={{ gap: 12, flexWrap: "wrap" }}>
          <div className="muted">
            Total: {items.length} • Submitted: {counts.submitted} • Accepted: {counts.accepted} • Rejected: {counts.rejected}
          </div>

          <div className="flex items-center gap-3" style={{ flexWrap: "wrap" }}>
            <input
              className="input"
              placeholder="Search proposals..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ minWidth: 220 }}
            />
            <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="submitted">Submitted</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
            <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="bidHigh">Bid: High to Low</option>
              <option value="bidLow">Bid: Low to High</option>
            </select>

            <Link to="/client/jobs" className="btn">
              Go to My Jobs
            </Link>
            <Link to="/client/contracts" className="btn">
              Open Contracts
            </Link>
          </div>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Freelancer</th>
              <th>Bid</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Message</th>
              <th style={{ width: 220 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((proposal) => {
              const id = proposal._id || proposal.proposalId;
              const status = normalizeStatus(proposal.status);
              const isPending = status === "submitted";

              return (
                <tr key={id}>
                  <td>
                    <div>{proposal.jobTitle || proposal.jobId}</div>
                    {proposal.jobId && (
                      <Link to={`/client/jobs/${proposal.jobId}`} className="muted">
                        View Job
                      </Link>
                    )}
                  </td>
                  <td>{proposal.freelancerName || proposal.freelancerId || "-"}</td>
                  <td>{formatMoney(proposal.price)}</td>
                  <td>
                    <span className="badge">{status}</span>
                  </td>
                  <td>{formatDate(proposal.createdAt)}</td>
                  <td style={{ maxWidth: 320, whiteSpace: "pre-wrap" }}>{proposal.message || "-"}</td>
                  <td>
                    <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn btnOk"
                        disabled={!isPending || busyId === id}
                        onClick={() => handleAccept(id)}
                      >
                        {busyId === id ? "Working..." : "Accept"}
                      </button>

                      <button
                        type="button"
                        className="btn btnDanger"
                        disabled={!isPending || busyId === id}
                        onClick={() => handleReject(id)}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className="btn"
                        disabled={status !== "accepted" || busyId === id}
                        onClick={() => createContract(id)}
                      >
                        Create Contract
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="muted">
                  No proposals found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
