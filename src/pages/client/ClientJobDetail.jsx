import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ErrorBox from "../../components/ErrorBox";
import Loading from "../../components/Loading";
import { jobService } from "../../services/jobService";
import { proposalService } from "../../services/proposalService";

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

function toArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function normalizeStatus(value) {
  return String(value || "submitted").toLowerCase();
}

function normalizeJobStatus(value, fallback = "open") {
  const raw = String(value || fallback).trim().toLowerCase();
  if (raw === "closed") return "cancelled";
  if (["draft", "open", "in_progress", "completed", "cancelled"].includes(raw)) return raw;
  return fallback;
}

function formatStatusLabel(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function ClientJobDetail() {
  const { jobId } = useParams();

  const [job, setJob] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    if (!jobId) return;

    setLoading(true);
    setError("");

    try {
      const [jobData, proposalData] = await Promise.all([
        jobService.getById(jobId),
        proposalService.list({ mine: "client", jobId }),
      ]);

      setJob(jobData || null);
      setProposals(toArray(proposalData));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  const proposalStats = useMemo(() => {
    const out = { submitted: 0, accepted: 0, rejected: 0, withdrawn: 0 };
    for (const proposal of proposals) {
      const status = normalizeStatus(proposal.status);
      if (out[status] !== undefined) out[status] += 1;
    }
    return out;
  }, [proposals]);

  const normalizedJobStatus = normalizeJobStatus(job?.status, "open");
  const isJobLocked =
    normalizedJobStatus !== "open" ||
    Boolean(job?.isLocked) ||
    Boolean(String(job?.acceptedProposalId || "").trim()) ||
    proposalStats.accepted > 0;

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

  if (loading) return <Loading />;

  if (!job) {
    return (
      <div className="row">
        <ErrorBox message={error || "Job not found."} />
        <Link to="/client/jobs" className="btn">
          Back to My Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="row">
      <div className="card">
        <div className="flex justify-between items-center" style={{ gap: 12, flexWrap: "wrap" }}>
          <div>
            <div className="h1">{job.title}</div>
            <div className="muted">
              Posted {formatDate(job.createdAt || job.postedAt)} • Status: {formatStatusLabel(normalizedJobStatus)}
            </div>
          </div>

          <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
            {isJobLocked ? (
              <button type="button" className="btn" disabled title="Only open jobs with no accepted proposal can be edited.">
                Locked
              </button>
            ) : (
              <Link to={`/client/jobs/${jobId}/edit`} className="btn">
                Edit Job
              </Link>
            )}
            <Link to="/client/jobs" className="btn">
              Back
            </Link>
          </div>
        </div>
      </div>

      <ErrorBox message={error} />

      <div className="grid2">
        <div className="card">
          <div className="h2">Project Details</div>
          <p style={{ marginTop: 0, whiteSpace: "pre-wrap" }}>{job.description}</p>
        </div>

        <div className="card">
          <div className="h2">Budget & Scope</div>
          <table className="table">
            <tbody>
              <tr>
                <th>Budget</th>
                <td>{formatMoney(job.budget)}</td>
              </tr>
              <tr>
                <th>Category</th>
                <td>{job.category || "General"}</td>
              </tr>
              <tr>
                <th>Experience</th>
                <td>{job.experienceLevel || "Intermediate"}</td>
              </tr>
              <tr>
                <th>Type</th>
                <td>{job.projectType || "Fixed"}</td>
              </tr>
              <tr>
                <th>Duration</th>
                <td>{job.duration || "1 to 3 months"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="h2">Proposals for This Job</div>
        <div className="muted" style={{ marginBottom: 10 }}>
          Total: {proposals.length} • Submitted: {proposalStats.submitted} • Accepted: {proposalStats.accepted} • Rejected: {proposalStats.rejected}
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Freelancer</th>
              <th>Bid</th>
              <th>Status</th>
              <th>Date</th>
              <th>Message</th>
              <th style={{ width: 220 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {proposals.map((proposal) => {
              const id = proposal._id || proposal.proposalId;
              const status = normalizeStatus(proposal.status);
              const actionable = status === "submitted" && !isJobLocked;

              return (
                <tr key={id}>
                  <td>{proposal.freelancerName || proposal.freelancerId || "-"}</td>
                  <td>{formatMoney(proposal.price)}</td>
                  <td>
                    <span className="badge">{status}</span>
                  </td>
                  <td>{formatDate(proposal.createdAt)}</td>
                  <td style={{ maxWidth: 360, whiteSpace: "pre-wrap" }}>{proposal.message || "-"}</td>
                  <td>
                    <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn btnOk"
                        disabled={!actionable || busyId === id}
                        onClick={() => handleAccept(id)}
                      >
                        {busyId === id ? "Working..." : "Accept"}
                      </button>

                      <button
                        type="button"
                        className="btn btnDanger"
                        disabled={!actionable || busyId === id}
                        onClick={() => handleReject(id)}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {proposals.length === 0 && (
              <tr>
                <td colSpan="6" className="muted">
                  No proposals yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
