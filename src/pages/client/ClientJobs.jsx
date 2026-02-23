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
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
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

  const owner = useMemo(
    () => ({
      id: normalizeString(user?.id || user?._id || user?.userId || user?.sub),
      email: normalizeEmail(user?.email),
    }),
    [user]
  );

  const openCount = useMemo(
    () => items.filter((job) => String(job.status || "open") === "open").length,
    [items]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const mineData = await jobService.getAll({ mine: "client", sort: "newest" });
      let rows = toJobsArray(mineData);

      if (rows.length === 0 && (owner.id || owner.email)) {
        const broadData = await jobService.getAll({ sort: "newest" });
        rows = toJobsArray(broadData).filter((job) => isOwnedByUser(job, owner));
      }

      setItems(rows);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [owner]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loading />;

  return (
    <div className="row">
      <div className="card">
        <div className="h1">My Jobs</div>
        <div className="muted">Create and manage your project postings with realistic requirements.</div>
      </div>

      <ErrorBox message={error} />

      <div className="card">
        <div className="flex justify-between items-center">
          <div>
            <div className="h2">Job Posts</div>
            <div className="muted">Total: {items.length} • Open: {openCount}</div>
          </div>
          <Link to="/client/jobs/new" className="btn btnOk">
            + Create Job
          </Link>
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
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((job) => (
                <tr key={job._id || job.jobId}>
                  <td>{job.title}</td>
                  <td>{job.category || "General"}</td>
                  <td>{formatMoney(job.budget)}</td>
                  <td>{formatDate(extractJobDate(job))}</td>
                  <td>{Number(job.proposalsCount || 0)}</td>
                  <td>
                    <span className="badge">{job.status || "open"}</span>
                  </td>
                  <td>
                    <Link to={`/client/jobs/${job._id || job.jobId}/edit`} className="btn">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
