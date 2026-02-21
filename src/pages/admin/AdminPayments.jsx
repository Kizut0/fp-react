import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import ErrorBox from "../../components/ErrorBox";
import { adminService } from "../../services/adminService";

export default function AdminPayments() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    useEffect(() => {
        const run = async () => {
            setLoading(true); setErr(null);
            try {
                const data = await adminService.payments.list();
                setItems(data?.items || data || []);
            } catch (e) { setErr(e); }
            finally { setLoading(false); }
        };
        run();
    }, []);

    if (loading) return <Loading />;

    return (
        <div className="row">
            <div className="card"><div className="h1">Payments Monitor</div><div className="muted">All payment records (admin view).</div></div>
            <ErrorBox error={err} />
            <div className="card">
                <table className="table">
                    <thead><tr><th>Contract</th><th>Client</th><th>Freelancer</th><th>Amount</th><th>Status</th></tr></thead>
                    <tbody>
                        {items.map((p) => (
                            <tr key={p._id || p.paymentId}>
                                <td>{p.contractId}</td>
                                <td>{p.clientName || p.clientId}</td>
                                <td>{p.freelancerName || p.freelancerId}</td>
                                <td>{p.amount}</td>
                                <td><span className="badge">{p.paymentStatus}</span></td>
                            </tr>
                        ))}
                        {items.length === 0 && <tr><td colSpan="5" className="muted">No payments.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}