import React, { useEffect, useMemo, useState } from "react";
import Loading from "../../components/Loading";
import ErrorBox from "../../components/ErrorBox";
import { adminService } from "../../services/adminService";
import { proposalService } from "../../services/proposalService";

function normalizeStatus(value, fallback = "submitted") {
    const raw = String(value || fallback).trim().toLowerCase();
    if (["submitted", "accepted", "rejected", "withdrawn"].includes(raw)) return raw;
    return fallback;
}

export default function AdminProposals() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [busyId, setBusyId] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [query, setQuery] = useState("");

    const load = async () => {
        setLoading(true); setErr(null);
        try {
            const data = await adminService.proposals.list();
            setItems(data?.items || data || []);
        } catch (e) { setErr(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        load();
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return items.filter((item) => {
            const status = normalizeStatus(item.status);
            if (statusFilter !== "all" && status !== statusFilter) return false;
            if (!q) return true;

            const fields = [item.jobTitle, item.jobId, item.freelancerName, item.freelancerId, item.message]
                .map((v) => String(v || "").toLowerCase())
                .join(" ");

            return fields.includes(q);
        });
    }, [items, query, statusFilter]);

    const setStatus = async (proposal, status) => {
        const id = proposal._id || proposal.proposalId;
        if (!id) return;

        setBusyId(id); setErr(null);
        try {
            await proposalService.update(id, { status });
            await load();
        } catch (e) { setErr(e); }
        finally { setBusyId(""); }
    };

    const remove = async (proposal) => {
        const id = proposal._id || proposal.proposalId;
        if (!id) return;

        const confirmed = window.confirm("Delete this proposal?");
        if (!confirmed) return;

        setBusyId(id); setErr(null);
        try {
            await proposalService.remove(id);
            await load();
        } catch (e) { setErr(e); }
        finally { setBusyId(""); }
    };

    if (loading) return <Loading />;

    return (
        <div className="row">
            <div className="card"><div className="h1">Proposals Monitor</div><div className="muted">All proposals (admin view).</div></div>
            <ErrorBox error={err} />
            <div className="card">
                <div className="flex justify-between items-center" style={{ gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                    <div className="muted">Total proposals: {items.length}</div>
                    <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
                        <input
                            className="input"
                            placeholder="Search proposals..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            style={{ minWidth: 220 }}
                        />
                        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">All status</option>
                            <option value="submitted">Submitted</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                            <option value="withdrawn">Withdrawn</option>
                        </select>
                    </div>
                </div>
                <table className="table">
                    <thead><tr><th>Job</th><th>Freelancer</th><th>Price</th><th>Status</th><th style={{ width: 320 }}>Actions</th></tr></thead>
                    <tbody>
                        {filtered.map((p) => (
                            <tr key={p._id || p.proposalId}>
                                <td>{p.jobTitle || p.jobId}</td>
                                <td>{p.freelancerName || p.freelancerId}</td>
                                <td>{p.price}</td>
                                <td><span className="badge">{normalizeStatus(p.status)}</span></td>
                                <td>
                                    <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
                                        <button className="btn btnOk" disabled={busyId === (p._id || p.proposalId)} onClick={() => setStatus(p, "accepted")}>
                                            Accept
                                        </button>
                                        <button className="btn" disabled={busyId === (p._id || p.proposalId)} onClick={() => setStatus(p, "rejected")}>
                                            Reject
                                        </button>
                                        <button className="btn" disabled={busyId === (p._id || p.proposalId)} onClick={() => setStatus(p, "withdrawn")}>
                                            Withdraw
                                        </button>
                                        <button className="btn btnDanger" disabled={busyId === (p._id || p.proposalId)} onClick={() => remove(p)}>
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && <tr><td colSpan="5" className="muted">No proposals found for this filter.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
