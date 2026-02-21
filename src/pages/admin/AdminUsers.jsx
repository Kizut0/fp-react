import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import ErrorBox from "../../components/ErrorBox";
import ConfirmButton from "../../components/ConfirmButton";
import { adminService } from "../../services/adminService";

export default function AdminUsers() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [busyId, setBusyId] = useState("");

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

    if (loading) return <Loading />;

    return (
        <div className="row">
            <div className="card">
                <div className="h1">User Management</div>
                <div className="muted">Verify/block/remove accounts.</div>
            </div>

            <ErrorBox error={err} />

            <div className="card">
                <table className="table">
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th style={{ width: 360 }}>Actions</th></tr></thead>
                    <tbody>
                        {items.map((u) => {
                            const id = u._id || u.userId;
                            return (
                                <tr key={id}>
                                    <td>{u.name}</td>
                                    <td className="muted">{u.email}</td>
                                    <td><span className="badge">{u.role}</span></td>
                                    <td><span className="badge">{u.status || "active"}</span></td>
                                    <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                        <button className="btn btnOk" disabled={busyId === id} onClick={() => setStatus(id, "active")}>Verify/Activate</button>
                                        <button className="btn btnDanger" disabled={busyId === id} onClick={() => setStatus(id, "blocked")}>Block</button>
                                        <ConfirmButton confirmText="Remove this account?" onConfirm={() => remove(id)}>Delete</ConfirmButton>
                                    </td>
                                </tr>
                            );
                        })}
                        {items.length === 0 && <tr><td colSpan="5" className="muted">No users.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}