import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loading from "../../components/Loading";
import ErrorBox from "../../components/ErrorBox";
import StatCard from "../../components/StatCard";
import { adminService } from "../../services/adminService";

function toArray(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

function normalizeStatus(value) {
    return String(value || "").trim().toLowerCase();
}

function formatMoney(value) {
    const amount = Number(value || 0);
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(Number.isFinite(amount) ? amount : 0);
}

export default function AdminDashboard() {
    const [data, setData] = useState({});
    const [jobs, setJobs] = useState([]);
    const [proposals, setProposals] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [payments, setPayments] = useState([]);
    const [users, setUsers] = useState([]);
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const run = async () => {
            setLoading(true); setErr(null);
            try {
                const [dashboardData, userData, jobData, proposalData, contractData, paymentData] = await Promise.all([
                    adminService.dashboard(),
                    adminService.users.list(),
                    adminService.jobs.list(),
                    adminService.proposals.list(),
                    adminService.contracts.list(),
                    adminService.payments.list(),
                ]);

                setData(dashboardData || {});
                setUsers(toArray(userData));
                setJobs(toArray(jobData));
                setProposals(toArray(proposalData));
                setContracts(toArray(contractData));
                setPayments(toArray(paymentData));
            } catch (e) {
                setErr(e);
            } finally {
                setLoading(false);
            }
        };
        run();
    }, []);

    if (loading) return <Loading />;

    const blockedUsers = users.filter((user) => normalizeStatus(user.status) === "blocked").length;
    const openJobs = jobs.filter((job) => normalizeStatus(job.status) === "open").length;
    const submittedProposals = proposals.filter((item) => normalizeStatus(item.status) === "submitted").length;
    const activeContracts = contracts.filter((item) => normalizeStatus(item.status) === "active").length;
    const completedContracts = contracts.filter((item) => normalizeStatus(item.status) === "completed").length;
    const paidTotal = payments
        .filter((item) => normalizeStatus(item.status || item.paymentStatus) === "paid")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return (
        <div className="row">
            <div className="card">
                <div className="h1">Admin Dashboard</div>
                <div className="muted">Operational overview of marketplace health, risk, and transaction flow.</div>
            </div>

            <ErrorBox error={err} />

            <div className="grid3">
                <StatCard label="Total Users" value={data?.totalUsers ?? users.length} />
                <StatCard label="Blocked Users" value={blockedUsers} />
                <StatCard label="Open Jobs" value={data?.activeJobs ?? openJobs} />
            </div>

            <div className="grid3">
                <StatCard label="Pending Proposals" value={submittedProposals} />
                <StatCard label="Active Contracts" value={data?.activeContracts ?? activeContracts} />
                <StatCard label="Completed Contracts" value={completedContracts} />
            </div>

            <div className="grid3">
                <StatCard label="Payment Records" value={payments.length} />
                <StatCard label="Paid Volume (Logged)" value={formatMoney(paidTotal)} />
                <StatCard label="Top Job Categories" value={(data?.topCategories || []).join(", ") || "-"} />
            </div>

            <div className="card">
                <div className="h2">Quick Actions</div>
                <div className="quickActions">
                    <Link to="/admin/users" className="btn btnOk">Review Users</Link>
                    <Link to="/admin/jobs" className="btn">Moderate Jobs</Link>
                    <Link to="/admin/proposals" className="btn">Moderate Proposals</Link>
                    <Link to="/admin/contracts" className="btn">Moderate Contracts</Link>
                    <Link to="/admin/reviews" className="btn">Review Abuse Reports</Link>
                    <Link to="/admin/payments" className="btn">Audit Payments</Link>
                </div>
            </div>
        </div>
    );
}
