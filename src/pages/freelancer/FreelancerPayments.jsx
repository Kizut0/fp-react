import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import ErrorBox from "../../components/ErrorBox";
import { paymentService } from "../../services/paymentService";

export default function FreelancerPayments() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    useEffect(() => {
        const run = async () => {
            setLoading(true); setErr(null);
            try {
                const data = await paymentService.list("mine=freelancer");
                setItems(data?.items || data || []);
            } catch (e) {
                setErr(e);
            } finally {
                setLoading(false);
            }
        };
        run();
    }, []);

    if (loading) return <Loading />;

    return (
        <div className="row">
            <div className="card">
                <div className="h1">Payments</div>
                <div className="muted">View payment history and status.</div>
            </div>
            <ErrorBox error={err} />
            <div className="card">
                <table className="table">
                    <thead><tr><th>Contract</th><th>Amount</th><th>Status</th><th>Method</th><th>Date</th></tr></thead>
                    <tbody>
                        {items.map((p) => (
                            <tr key={p._id || p.paymentId}>
                                <td>{p.contractId}</td>
                                <td>{p.amount}</td>
                                <td><span className="badge">{p.paymentStatus}</span></td>
                                <td>{p.paymentMethod}</td>
                                <td className="muted">{p.paymentDate ? new Date(p.paymentDate).toLocaleString() : "-"}</td>
                            </tr>
                        ))}
                        {items.length === 0 && <tr><td colSpan="5" className="muted">No payments.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}