import React, { useEffect, useMemo, useState } from "react";
import Loading from "../../components/Loading";
import ErrorBox from "../../components/ErrorBox";
import { adminService } from "../../services/adminService";
import { jobService } from "../../services/jobService";

function normalizeStatus(value, fallback = "open") {
    const raw = String(value || fallback).trim().toLowerCase();
    if (raw === "closed") return "cancelled";
    if (["draft", "open", "in_progress", "completed", "cancelled"].includes(raw)) return raw;
    return fallback;
}

export default function AdminJobs() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [busyId, setBusyId] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [query, setQuery] = useState("");

    const load = async () => {
        setLoading(true); setErr(null);
        try {
            const data = await adminService.jobs.list();
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

            const fields = [item.title, item.clientName, item.clientId, item.category, item.description]
                .map((v) => String(v || "").toLowerCase())
                .join(" ");

            return fields.includes(q);
        });
    }, [items, query, statusFilter]);

    const toggleStatus = async (job) => {
        const id = job._id || job.jobId;
        if (!id) return;

        const currentStatus = normalizeStatus(job.status, "open");
        if (!["draft", "open", "cancelled"].includes(currentStatus)) return;

        setBusyId(id); setErr(null);
        try {
            const nextStatus = currentStatus === "open" ? "cancelled" : "open";
            await jobService.update(id, { status: nextStatus });
            await load();
        } catch (e) { setErr(e); }
        finally { setBusyId(""); }
    };

    const removeJob = async (job) => {
        const id = job._id || job.jobId;
        if (!id) return;

        const confirmed = window.confirm(`Delete job "${job.title}"?`);
        if (!confirmed) return;

        setBusyId(id); setErr(null);
        try {
            await jobService.delete(id);
            await load();
        } catch (e) { setErr(e); }
        finally { setBusyId(""); }
    };

    if (loading) return <Loading />;

    return (
        <div className="row">
            <div className="card"><div className="h1">Jobs Monitor</div><div className="muted">All job posts (admin view).</div></div>
            <ErrorBox error={err} />
            <div className="card">
                <div className="flex justify-between items-center" style={{ gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                    <div className="muted">Total: {items.length} • Open: {items.filter((j) => normalizeStatus(j.status) === "open").length}</div>
                    <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
                        <input
                            className="input"
                            placeholder="Search jobs..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            style={{ minWidth: 220 }}
                        />
                        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">All status</option>
                            <option value="open">Open</option>
                            <option value="draft">Draft</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
                <table className="table">
                    <thead><tr><th>Title</th><th>Client</th><th>Budget</th><th>Status</th><th style={{ width: 220 }}>Actions</th></tr></thead>
                    <tbody>
                        {filtered.map((j) => (
                            <tr key={j._id || j.jobId}>
                                <td>{j.title}</td>
                                <td>{j.clientName || j.clientId}</td>
                                <td>{j.budget}</td>
                                <td><span className="badge">{normalizeStatus(j.status)}</span></td>
                                <td>
                                    <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
                                        <button
                                            className="btn"
                                            disabled={
                                                busyId === (j._id || j.jobId) ||
                                                !["draft", "open", "cancelled"].includes(normalizeStatus(j.status))
                                            }
                                            onClick={() => toggleStatus(j)}
                                        >
                                            {normalizeStatus(j.status) === "open" ? "Cancel" : "Set Open"}
                                        </button>
                                        <button className="btn btnDanger" disabled={busyId === (j._id || j.jobId)} onClick={() => removeJob(j)}>
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && <tr><td colSpan="5" className="muted">No jobs found for this filter.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
