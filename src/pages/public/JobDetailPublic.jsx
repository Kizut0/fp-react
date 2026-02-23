import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { jobService } from "../../services/jobService";

function formatMoney(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function JobDetailPublic() {
  const { jobId, id } = useParams();
  const resolvedJobId = jobId || id;
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchJob = async () => {
      if (!resolvedJobId) {
        setLoading(false);
        setError("Invalid job ID.");
        return;
      }

      try {
        const data = await jobService.getById(resolvedJobId);
        setJob(data);
      } catch (e) {
        setError(e?.response?.data?.message || "Job not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [resolvedJobId]);

  const canApplyDirectly = useMemo(
    () => String(user?.role || "").toLowerCase() === "freelancer",
    [user]
  );

  if (loading) return <p className="p-6">Loading job...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!job) return <p className="p-6">Job not found.</p>;

  const skills = Array.isArray(job.skills) ? job.skills : [];

  return (
    <div className="row max-w-4xl mx-auto p-6">
      <div className="card">
        <div className="flex justify-between" style={{ gap: 16 }}>
          <div>
            <h1 className="text-3xl font-bold" style={{ margin: 0 }}>
              {job.title}
            </h1>
            <div className="muted" style={{ marginTop: 8 }}>
              Posted {formatDate(job.createdAt)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{formatMoney(job.budget)}</div>
            <div className="muted">Project Budget</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 12,
          }}
        >
          <span className="badge">{job.category || "General"}</span>
          <span className="badge">{job.experienceLevel || "Intermediate"}</span>
          <span className="badge">{job.projectType || "Fixed"}</span>
          <span className="badge">{job.locationType || "Remote"}</span>
          <span className="badge">{job.duration || "1 to 3 months"}</span>
          <span className="badge">{Number(job.proposalsCount || 0)} proposals</span>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="h2">Project Description</div>
          <p className="text-gray-700" style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
            {job.description}
          </p>
        </div>

        <div className="card">
          <div className="h2">Project Overview</div>
          <table className="table">
            <tbody>
              <tr>
                <th>Category</th>
                <td>{job.category || "General"}</td>
              </tr>
              <tr>
                <th>Experience Level</th>
                <td>{job.experienceLevel || "Intermediate"}</td>
              </tr>
              <tr>
                <th>Project Type</th>
                <td>{job.projectType || "Fixed"}</td>
              </tr>
              <tr>
                <th>Duration</th>
                <td>{job.duration || "1 to 3 months"}</td>
              </tr>
              <tr>
                <th>Location</th>
                <td>{job.locationType || "Remote"}</td>
              </tr>
              <tr>
                <th>Status</th>
                <td>{job.status || "open"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="h2">Required Skills</div>
        {skills.length === 0 ? (
          <div className="muted">No specific skills listed by client.</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {skills.map((skill) => (
              <span key={skill} className="badge">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="h2">Interested in this job?</div>
        <div className="muted" style={{ marginBottom: 12 }}>
          Submit a proposal with your timeline, total price, and delivery plan.
        </div>

        <div className="flex gap-3">
          {canApplyDirectly ? (
            <Link
              to="/freelancer/proposals"
              state={{ createForJob: job }}
              className="btn btnOk"
            >
              Submit Proposal
            </Link>
          ) : (
            <Link to="/login" className="btn btnOk">
              Login to Apply
            </Link>
          )}

          <Link to="/jobs" className="btn">
            Back to Job List
          </Link>
        </div>
      </div>
    </div>
  );
}
