import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ErrorBox from "../../components/ErrorBox";
import Loading from "../../components/Loading";
import { useAuth } from "../../contexts/AuthContext";
import { jobService } from "../../services/jobService";

function toJobsArray(data) {
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

function renderBudget(job) {
  const remaining = Number(job?.budget || 0);
  const original = Number(job?.budgetOriginal || remaining);
  const hasReduction = Number.isFinite(original) && Number.isFinite(remaining) && original > remaining;

  if (!hasReduction) return formatMoney(remaining);
  return `${formatMoney(remaining)} / ${formatMoney(original)}`;
}

function extractJobDate(job) {
  return job?.createdAt || job?.postedAt || job?.postedDate || job?.date || null;
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

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

function normalizeStatus(value, fallback = "open") {
  const raw = String(value || fallback).trim().toLowerCase();
  if (raw === "closed") return "cancelled";
  if (["draft", "open", "in_progress", "completed", "cancelled"].includes(raw)) return raw;
  return fallback;
}

function formatStatusLabel(status) {
  return String(status || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isJobLocked(job) {
  const status = normalizeStatus(job?.status, "open");
  if (status !== "open") return true;
  if (job?.isLocked) return true;
  return normalizeString(job?.acceptedProposalId) !== "";
}

function canClientManageJob(job) {
  return normalizeStatus(job?.status, "open") === "open" && !isJobLocked(job);
}

function isOwnedByUser(job, owner) {
  const ownerIds = [owner.id].filter(Boolean);
  const jobOwnerIds = [job?.clientId, job?.userId, job?.ownerId, job?.createdBy]
    .map(normalizeString)
    .filter(Boolean);

  if (jobOwnerIds.some((id) => ownerIds.includes(id))) return true;

  const ownerEmail = owner.email;
  if (!ownerEmail) return false;

  const jobEmails = [job?.clientEmail, job?.email].map(normalizeEmail).filter(Boolean);
  return jobEmails.includes(ownerEmail);
}

export default function ClientJobs() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [query, setQuery] = useState("");

  const owner = useMemo(
    () => ({
      id: normalizeString(user?.id || user?._id || user?.userId || user?.sub),
      email: normalizeEmail(user?.email),
    }),
    [user]
  );

  const statusCounts = useMemo(
    () =>
      items.reduce(
        (acc, job) => {
          const status = normalizeStatus(job?.status, "open");
          if (acc[status] !== undefined) acc[status] += 1;
          return acc;
        },
        { draft: 0, open: 0, in_progress: 0, completed: 0, cancelled: 0 }
      ),
    [items]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const mineData = await jobService.getAll({
        mine: "client",
        sort,
        status: statusFilter,
        q: query.trim(),
      });
      let rows = toJobsArray(mineData);

      if (rows.length === 0 && (owner.id || owner.email)) {
        const broadData = await jobService.getAll({ sort, status: statusFilter, q: query.trim() });
        rows = toJobsArray(broadData).filter((job) => isOwnedByUser(job, owner));
      }

      setItems(rows);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [owner, query, sort, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const removeJob = async (job) => {
    const id = job._id || job.jobId;
    if (!id) return;

    const confirmed = window.confirm(`Delete job "${job.title}"?`);
    if (!confirmed) return;

    setBusyId(id);
    setError("");
    try {
      await jobService.delete(id);
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
        <div className="h1">My Jobs</div>
        <div className="muted">Create and manage your project postings with realistic requirements.</div>
      </div>

      <ErrorBox message={error} />

      <div className="card">
        <div className="flex justify-between items-center" style={{ gap: 12, flexWrap: "wrap" }}>
          <div>
            <div className="h2">Job Posts</div>
            <div className="muted">
              Total: {items.length} • Open: {statusCounts.open} • In Progress: {statusCounts.in_progress}
            </div>
          </div>

          <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
            <input
              className="input"
              placeholder="Search title, description, skills..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ minWidth: 250 }}
            />
            <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All status</option>
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="budgetHigh">Budget: High to Low</option>
              <option value="budgetLow">Budget: Low to High</option>
              <option value="mostProposals">Most Proposals</option>
            </select>
            <Link to="/client/jobs/new" className="btn btnOk">
              + Create Job
            </Link>
          </div>
        </div>
      </div>

      <div className="card">
        {items.length === 0 ? (
          <p className="muted">No jobs yet. Click "Create Job" to post your first project.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Budget</th>
                <th>Posted</th>
                <th>Proposals</th>
                <th>Status</th>
                <th style={{ width: 220 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((job) => {
                const id = job._id || job.jobId;
                const status = normalizeStatus(job.status, "open");
                const canManage = canClientManageJob(job);
                const busy = busyId === id;
                const lockHint = canManage
                  ? ""
                  : "Only open jobs with no accepted proposal can be edited or deleted.";

                return (
                  <tr key={id}>
                    <td>{job.title}</td>
                    <td>{job.category || "General"}</td>
                    <td>{renderBudget(job)}</td>
                    <td>{formatDate(extractJobDate(job))}</td>
                    <td>{Number(job.proposalsCount || 0)}</td>
                    <td>
                      <span className="badge">{formatStatusLabel(status)}</span>
                    </td>
                    <td>
                      <div className="jobActions">
                        <Link to={`/client/jobs/${id}`} className="btn btnGhost">
                          View
                        </Link>
                        {canManage ? (
                          <Link to={`/client/jobs/${id}/edit`} className="btn btnInfo">
                            Edit
                          </Link>
                        ) : (
                          <button type="button" className="btn btnInfo" disabled title={lockHint}>
                            Locked
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btnDanger"
                          disabled={busy || !canManage}
                          title={lockHint}
                          onClick={() => removeJob(job)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
