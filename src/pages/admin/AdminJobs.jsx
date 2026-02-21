import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import ErrorBox from "../../components/ErrorBox";
import { adminService } from "../../services/adminService";

export default function AdminJobs() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    useEffect(() => {
        const run = async () => {
            setLoading(true); setErr(null);
            try {
                const data = await adminService.jobs.list();
                setItems(data?.items || data || []);
            } catch (e) { setErr(e); }
            finally { setLoading(false); }
        };
        run();
    }, []);

    if (loading) return <Loading />;

    return (
        <div className="row">
            <div className="card"><div className="h1">Jobs Monitor</div><div className="muted">All job posts (admin view).</div></div>
            <ErrorBox error={err} />
            <div className="card">
                <table className="table">
                    <thead><tr><th>Title</th><th>Client</th><th>Budget</th><th>Status</th></tr></thead>
                    <tbody>
                        {items.map((j) => (
                            <tr key={j._id || j.jobId}>
                                <td>{j.title}</td>
                                <td>{j.clientName || j.clientId}</td>
                                <td>{j.budget}</td>
                                <td><span className="badge">{j.status}</span></td>
                            </tr>
                        ))}
                        {items.length === 0 && <tr><td colSpan="4" className="muted">No jobs.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}