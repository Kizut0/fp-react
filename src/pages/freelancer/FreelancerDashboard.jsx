import React, { useEffect, useState } from "react";
import ErrorBox from "../../components/ErrorBox";
import Loading from "../../components/Loading";
import StatCard from "../../components/StatCard";
import { dashboardService } from "../../services/dashboardService";

export default function FreelancerDashboard() {
    const [data, setData] = useState(null);
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const run = async () => {
            setLoading(true); setErr(null);
            try {
                setData(await dashboardService.freelancer());
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
                <div className="h1">Freelancer Dashboard</div>
                <div className="muted">Your proposals, contracts, and ratings.</div>
            </div>

            <ErrorBox error={err} />

            <div className="grid3">
                <StatCard label="Jobs Applied" value={data?.jobsApplied} />
                <StatCard label="Proposal Success Rate" value={data?.proposalSuccessRate ? `${data.proposalSuccessRate}%` : "-"} />
                <StatCard label="Active Contracts" value={data?.activeContracts} />
            </div>

            <div className="grid2">
                <StatCard label="Avg Rating" value={data?.avgRating ?? "-"} />
                <StatCard label="Popular Job Categories" value={(data?.popularCategories || []).join(", ") || "-"} />
            </div>
        </div>
    );
}