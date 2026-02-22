import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ErrorBox from "../../components/ErrorBox";
import Loading from "../../components/Loading";
import { useAuth } from "../../contexts/AuthContext";
import { jobService } from "../../services/jobService";

export default function ClientJobs() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const myJobs = useMemo(() => {
    const myId = String(user?._id || user?.id || "");
    if (!myId) return items;
    return items.filter((job) => String(job.clientId || "") === myId);
  }, [items, user]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await jobService.getAll();
      setItems(Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="row">
      <div className="card">
        <div className="h1">My Jobs</div>
        <div className="muted">Create and manage your job posts.</div>
      </div>

      <ErrorBox message={error} />

      <div className="card">
        <div className="flex justify-between items-center">
          <div>
            <div className="h2">Job Posts</div>
            <div className="muted">Total: {myJobs.length}</div>
          </div>
          <Link to="/client/jobs/new" className="btn btnOk">
            + Create Job
          </Link>
        </div>
      </div>

      <div className="card">
        {myJobs.length === 0 ? (
          <p className="muted">No jobs yet. Click "Create Job" to post your first project.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Budget</th>
                <th>Status</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {myJobs.map((job) => (
                <tr key={job._id || job.jobId}>
                  <td>{job.title}</td>
                  <td>${job.budget}</td>
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
