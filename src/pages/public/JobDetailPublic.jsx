import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Loading from "../../components/Loading";
import ErrorBox from "../../components/ErrorBox";
import { jobService } from "../../services/jobService";
import { useAuth } from "../../contexts/AuthContext";

export default function JobDetailPublic() {
    const { jobId } = useParams();
    const { user } = useAuth();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await jobService.get(jobId);
                setJob(data);
            } catch (e) {
                setError(e);
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [jobId]);

    if (loading) return <Loading />;
    return (
        <div className="row">
            <ErrorBox error={error} />
            {job && (
                <div className="card">
                    <div className="h1">{job.title}</div>
                    <div className="muted">Budget: {job.budget} | Status: <span className="badge">{job.status || "open"}</span></div>
                    <hr className="hr" />
                    <div style={{ whiteSpace: "pre-wrap" }}>{job.description}</div>

                    <hr className="hr" />
                    {user?.role === "Freelancer" ? (
                        <Link className="btn" to="/freelancer/proposals" state={{ createForJob: job }}>
                            Submit proposal
                        </Link>
                    ) : (
                        <div className="muted">
                            Login as <b>Freelancer</b> to submit a proposal.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}