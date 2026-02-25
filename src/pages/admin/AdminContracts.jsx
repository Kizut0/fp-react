import React, { useEffect, useMemo, useState } from "react";
import Loading from "../../components/Loading";
import ErrorBox from "../../components/ErrorBox";
import { adminService } from "../../services/adminService";
import { contractService } from "../../services/contractService";

function normalizeStatus(value, fallback = "active") {
    const raw = String(value || fallback).trim().toLowerCase();
    if (["active", "completed", "cancelled"].includes(raw)) return raw;
    return fallback;
}

export default function AdminContracts() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [busyId, setBusyId] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [query, setQuery] = useState("");

    const load = async () => {
        setLoading(true); setErr(null);
        try {
            const data = await adminService.contracts.list();
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

            const fields = [item.jobTitle, item.jobId, item.clientName, item.clientId, item.freelancerName, item.freelancerId]
                .map((v) => String(v || "").toLowerCase())
                .join(" ");

            return fields.includes(q);
        });
    }, [items, query, statusFilter]);

    const setStatus = async (contract, status) => {
        const id = contract._id || contract.contractId;
        if (!id) return;

        setBusyId(id); setErr(null);
        try {
            await contractService.update(id, { status });
            await load();
        } catch (e) { setErr(e); }
        finally { setBusyId(""); }
    };

    const remove = async (contract) => {
        const id = contract._id || contract.contractId;
        if (!id) return;

        const confirmed = window.confirm("Delete this contract?");
        if (!confirmed) return;

        setBusyId(id); setErr(null);
        try {
            await contractService.remove(id);
            await load();
        } catch (e) { setErr(e); }
        finally { setBusyId(""); }
    };

    if (loading) return <Loading />;

    return (
        <div className="row">
            <div className="card"><div className="h1">Contracts Monitor</div><div className="muted">All contracts (admin view).</div></div>
            <ErrorBox error={err} />
            <div className="card">
                <div className="flex justify-between items-center" style={{ gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                    <div className="muted">Total contracts: {items.length}</div>
                    <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
                        <input
                            className="input"
                            placeholder="Search contracts..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            style={{ minWidth: 220 }}
                        />
                        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">All status</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
                <table className="table">
                    <thead><tr><th>Job</th><th>Client</th><th>Freelancer</th><th>Status</th><th style={{ width: 320 }}>Actions</th></tr></thead>
                    <tbody>
                        {filtered.map((c) => (
                            <tr key={c._id || c.contractId}>
                                <td>{c.jobTitle || c.jobId}</td>
                                <td>{c.clientName || c.clientId}</td>
                                <td>{c.freelancerName || c.freelancerId}</td>
                                <td><span className="badge">{normalizeStatus(c.status)}</span></td>
                                <td>
                                    <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
                                        <button className="btn btnOk" disabled={busyId === (c._id || c.contractId)} onClick={() => setStatus(c, "active")}>
                                            Set Active
                                        </button>
                                        <button className="btn" disabled={busyId === (c._id || c.contractId)} onClick={() => setStatus(c, "completed")}>
                                            Complete
                                        </button>
                                        <button className="btn" disabled={busyId === (c._id || c.contractId)} onClick={() => setStatus(c, "cancelled")}>
                                            Cancel
                                        </button>
                                        <button className="btn btnDanger" disabled={busyId === (c._id || c.contractId)} onClick={() => remove(c)}>
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && <tr><td colSpan="5" className="muted">No contracts found for this filter.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
