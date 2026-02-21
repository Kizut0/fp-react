import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import ErrorBox from "../../components/ErrorBox";
import { adminService } from "../../services/adminService";

export default function AdminContracts() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    useEffect(() => {
        const run = async () => {
            setLoading(true); setErr(null);
            try {
                const data = await adminService.contracts.list();
                setItems(data?.items || data || []);
            } catch (e) { setErr(e); }
            finally { setLoading(false); }
        };
        run();
    }, []);

    if (loading) return <Loading />;

    return (
        <div className="row">
            <div className="card"><div className="h1">Contracts Monitor</div><div className="muted">All contracts (admin view).</div></div>
            <ErrorBox error={err} />
            <div className="card">
                <table className="table">
                    <thead><tr><th>Job</th><th>Client</th><th>Freelancer</th><th>Status</th></tr></thead>
                    <tbody>
                        {items.map((c) => (
                            <tr key={c._id || c.contractId}>
                                <td>{c.jobTitle || c.jobId}</td>
                                <td>{c.clientName || c.clientId}</td>
                                <td>{c.freelancerName || c.freelancerId}</td>
                                <td><span className="badge">{c.status}</span></td>
                            </tr>
                        ))}
                        {items.length === 0 && <tr><td colSpan="4" className="muted">No contracts.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}