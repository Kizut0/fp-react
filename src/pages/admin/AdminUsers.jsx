import React, { useEffect, useMemo, useState } from "react";
import Loading from "../../components/Loading";
import ErrorBox from "../../components/ErrorBox";
import ConfirmButton from "../../components/ConfirmButton";
import { adminService } from "../../services/adminService";

function normalize(value) {
    return String(value || "").trim().toLowerCase();
}

function normalizeStatus(value) {
    const raw = normalize(value || "active");
    if (["deactive", "deactivated", "inactive"].includes(raw)) return "deactive";
    return raw || "active";
}

function getWithdrawCount(user) {
    const value = Number(user?.withdrawCount ?? 0);
    return Number.isFinite(value) && value >= 0 ? value : 0;
}

export default function AdminUsers() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [busyId, setBusyId] = useState("");
    const [query, setQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const load = async () => {
        setLoading(true); setErr(null);
        try {
            const data = await adminService.users.list();
            setItems(data?.items || data || []);
        } catch (e) {
            setErr(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const setStatus = async (id, status) => {
        setBusyId(id);
        try {
            await adminService.users.update(id, { status });
            await load();
        } finally {
            setBusyId("");
        }
    };

    const remove = async (id) => {
        setBusyId(id);
        try {
            await adminService.users.remove(id);
            await load();
        } finally {
            setBusyId("");
        }
    };

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return items.filter((user) => {
            const role = normalize(user.role);
            const status = normalizeStatus(user.status);

            if (roleFilter !== "all" && role !== roleFilter) return false;
            if (statusFilter !== "all" && status !== statusFilter) return false;
            if (!q) return true;

            const fields = [user.name, user.email, user.role, status, getWithdrawCount(user)]
                .map((v) => String(v || "").toLowerCase())
                .join(" ");

            return fields.includes(q);
        });
    }, [items, query, roleFilter, statusFilter]);

    if (loading) return <Loading />;

    return (
        <div className="row">
            <div className="card">
                <div className="h1">User Management</div>
                <div className="muted">Verify/block/remove accounts.</div>
            </div>

            <ErrorBox error={err} />

            <div className="card">
                <div className="flex justify-between items-center" style={{ gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                    <div className="muted">Total: {items.length} users</div>
                    <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
                        <input
                            className="input"
                            placeholder="Search users..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            style={{ minWidth: 220 }}
                        />
                        <select className="input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                            <option value="all">All roles</option>
                            <option value="admin">Admin</option>
                            <option value="client">Client</option>
                            <option value="freelancer">Freelancer</option>
                        </select>
                        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">All status</option>
                            <option value="active">Active</option>
                            <option value="blocked">Blocked</option>
                            <option value="deactive">Deactive</option>
                        </select>
                    </div>
                </div>
                <table className="table">
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Withdraw Count</th><th style={{ width: 360 }}>Actions</th></tr></thead>
                    <tbody>
                        {filtered.map((u) => {
                            const id = u._id || u.userId;
                            const role = normalize(u.role);
                            const status = normalizeStatus(u.status);
                            return (
                                <tr key={id}>
                                    <td>{u.name}</td>
                                    <td className="muted">{u.email}</td>
                                    <td><span className="badge">{u.role}</span></td>
                                    <td><span className="badge">{status}</span></td>
                                    <td>{role === "freelancer" ? getWithdrawCount(u) : "-"}</td>
                                    <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                        <button className="btn btnOk" disabled={busyId === id} onClick={() => setStatus(id, "active")}>Verify/Activate</button>
                                        <button className="btn btnDanger" disabled={busyId === id} onClick={() => setStatus(id, "blocked")}>Block</button>
                                        <ConfirmButton confirmText="Remove this account?" onConfirm={() => remove(id)}>Delete</ConfirmButton>
                                    </td>
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && <tr><td colSpan="6" className="muted">No users found for this filter.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
