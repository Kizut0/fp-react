import React, { useEffect, useMemo, useState } from "react";
import Loading from "../../components/Loading";
import ErrorBox from "../../components/ErrorBox";
import { paymentService } from "../../services/paymentService";

function normalizeStatus(value, fallback = "unknown") {
    const raw = String(value || fallback).trim().toLowerCase();
    return raw || fallback;
}

function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
}

export default function FreelancerPayments() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [query, setQuery] = useState("");

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

    const totals = useMemo(() => {
        const out = { paid: 0, pending: 0, failed: 0, amount: 0 };
        items.forEach((item) => {
            const status = normalizeStatus(item.status || item.paymentStatus);
            if (out[status] !== undefined) out[status] += 1;
            if (status === "paid") out.amount += Number(item.amount || 0);
        });
        return out;
    }, [items]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return items.filter((item) => {
            const status = normalizeStatus(item.status || item.paymentStatus);
            if (statusFilter !== "all" && status !== statusFilter) return false;
            if (!q) return true;

            const fields = [item.contractId, item.note, item.freelancerId]
                .map((v) => String(v || "").toLowerCase())
                .join(" ");

            return fields.includes(q);
        });
    }, [items, query, statusFilter]);

    const formatMoney = (value) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(Number.isFinite(Number(value)) ? Number(value) : 0);

    if (loading) return <Loading />;

    return (
        <div className="row">
            <div className="card">
                <div className="h1">Payments</div>
                <div className="muted">View payment history and status.</div>
            </div>
            <ErrorBox error={err} />
            <div className="card">
                <div className="flex justify-between items-center" style={{ gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                    <div className="muted">
                        Total: {items.length} • Paid: {totals.paid} • Pending: {totals.pending} • Failed: {totals.failed} • Paid amount: {formatMoney(totals.amount)}
                    </div>
                    <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
                        <input
                            className="input"
                            placeholder="Search payments..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            style={{ minWidth: 220 }}
                        />
                        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">All status</option>
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                </div>
                <table className="table">
                    <thead><tr><th>Contract</th><th>Amount</th><th>Status</th><th>Note</th><th>Date</th></tr></thead>
                    <tbody>
                        {filtered.map((p) => (
                            <tr key={p._id || p.paymentId}>
                                <td>{p.contractId}</td>
                                <td>{p.amount}</td>
                                <td><span className="badge">{normalizeStatus(p.status || p.paymentStatus)}</span></td>
                                <td style={{ whiteSpace: "pre-wrap" }}>{p.note || p.paymentMethod || "-"}</td>
                                <td className="muted">{formatDateTime(p.createdAt || p.paymentDate || p.updatedAt)}</td>
                            </tr>
                        ))}
                        {filtered.length === 0 && <tr><td colSpan="5" className="muted">No payments found for this filter.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
