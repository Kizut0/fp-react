import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import ErrorBox from "../../components/ErrorBox";
import StatCard from "../../components/StatCard";
import { adminService } from "../../services/adminService";

export default function AdminDashboard() {
    const [data, setData] = useState(null);
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const run = async () => {
            setLoading(true); setErr(null);
            try {
                setData(await adminService.dashboard());
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
                <div className="h1">Admin Dashboard</div>
                <div className="muted">Platform monitoring overview.</div>
            </div>

            <ErrorBox error={err} />

            <div className="grid3">
                <StatCard label="Total Users" value={data?.totalUsers} />
                <StatCard label="Active Jobs" value={data?.activeJobs} />
                <StatCard label="Active Contracts" value={data?.activeContracts} />
            </div>

            <div className="grid2">
                <StatCard label="Proposal Trends" value={(data?.proposalTrends || []).join(", ") || "-"} />
                <StatCard label="Top Job Categories" value={(data?.topCategories || []).join(", ") || "-"} />
            </div>
        </div>
    );
}