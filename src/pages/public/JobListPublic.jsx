import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ErrorBox from "../../components/ErrorBox";
import Loading from "../../components/Loading";
import { jobService } from "../../services/jobService";

export default function JobListPublic() {
    const [items, setItems] = useState([]);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await jobService.list(q ? `q=${encodeURIComponent(q)}` : "");
            setItems(data?.items || data || []);
        } catch (e) {
            setError(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    return (
        <div className="row">
            <div className="card">
                <div className="h1">Browse Jobs</div>
                <div style={{ display: "flex", gap: 10 }}>
                    <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title / keyword..." />
                    <button className="btn" onClick={load}>Search</button>
                </div>
            </div>

            <ErrorBox error={error} />
            {loading ? <Loading /> : (
                <div className="card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Budget</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((j) => (
                                <tr key={j._id || j.jobId}>
                                    <td>
                                        <Link to={`/jobs/${j._id || j.jobId}`} style={{ textDecoration: "underline" }}>
                                            {j.title}
                                        </Link>
                                    </td>
                                    <td>{j.budget}</td>
                                    <td><span className="badge">{j.status || "open"}</span></td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr><td colSpan="3" className="muted">No jobs found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}