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

function getDateFromItem(item) {
    const raw = item?.completedAt || item?.updatedAt || item?.createdAt || item?.date;
    if (!raw) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
}

function getLastNMonths(n = 6) {
    const now = new Date();
    const months = [];
    for (let i = n - 1; i >= 0; i -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleString("en-US", { month: "short" });
        months.push({ key, label });
    }
    return months;
}

function polarToCartesian(cx, cy, radius, angleDeg) {
    const angle = ((angleDeg - 90) * Math.PI) / 180;
    return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
    };
}

function describeArc(cx, cy, radius, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
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

    const recentMonths = getLastNMonths(6);
    const completedPerMonth = recentMonths.map((month) => {
        const count = contracts.filter((contract) => {
            if (normalizeStatus(contract.status) !== "completed") return false;
            const date = getDateFromItem(contract);
            if (!date) return false;
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            return key === month.key;
        }).length;
        return { ...month, value: count };
    });

    const maxCompleted = Math.max(1, ...completedPerMonth.map((item) => item.value));
    const chartWidth = 320;
    const chartHeight = 170;
    const xPad = 22;
    const yTop = 20;
    const yBottom = 120;
    const linePoints = completedPerMonth.map((item, index) => {
        const xStep = completedPerMonth.length > 1 ? (chartWidth - xPad * 2) / (completedPerMonth.length - 1) : 0;
        const x = xPad + index * xStep;
        const y = yBottom - (item.value / maxCompleted) * (yBottom - yTop);
        return { ...item, x, y };
    });
    const linePath = linePoints.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    const now = new Date();
    const currentMonthJobs = jobs.filter((job) => {
        const date = getDateFromItem(job);
        return date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    });
    const pieColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
    const categoryMap = currentMonthJobs.reduce((acc, job) => {
        const key = String(job.category || "Other").trim() || "Other";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
    const categoryPoints = Object.entries(categoryMap)
        .map(([label, value], index) => ({ label, value, color: pieColors[index % pieColors.length] }))
        .sort((a, b) => b.value - a.value);
    const categoryTotal = categoryPoints.reduce((sum, item) => sum + item.value, 0);
    const pieSegments = categoryPoints.reduce((acc, item) => {
        const start = acc.nextAngle;
        const slice = categoryTotal > 0 ? (item.value / categoryTotal) * 360 : 0;
        const end = start + slice;
        acc.items.push({ ...item, start, end });
        acc.nextAngle = end;
        return acc;
    }, { nextAngle: 0, items: [] }).items;

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

            <div className="grid2">
                <div className="card">
                    <div className="h2">Monthly Freelance Jobs Done</div>
                    <div className="muted">Completed contracts over the last 6 months.</div>
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: "100%", height: 210, marginTop: 10 }}>
                        <line x1={xPad} y1={yBottom} x2={chartWidth - xPad} y2={yBottom} stroke="#e5e7eb" />
                        <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
                        {linePoints.map((point) => (
                            <g key={point.key}>
                                <circle cx={point.x} cy={point.y} r="4" fill="#1d4ed8" />
                                <text x={point.x} y={yBottom + 22} textAnchor="middle" fontSize="11" fill="#6b7280">
                                    {point.label}
                                </text>
                                <text x={point.x} y={point.y - 8} textAnchor="middle" fontSize="11" fill="#111827">
                                    {point.value}
                                </text>
                            </g>
                        ))}
                    </svg>
                </div>

                <div className="card">
                    <div className="h2">Monthly Client Job Request Category</div>
                    <div className="muted">Current month job requests grouped by category.</div>
                    {categoryTotal === 0 ? (
                        <div className="muted" style={{ marginTop: 12 }}>No job requests found for this month.</div>
                    ) : (
                        <>
                            <svg viewBox="0 0 220 220" style={{ width: "100%", height: 220, marginTop: 8 }}>
                                {pieSegments.length === 1 ? (
                                    <circle cx="110" cy="110" r="88" fill={pieSegments[0].color} />
                                ) : (
                                    pieSegments.map((item) => (
                                        <path key={item.label} d={describeArc(110, 110, 88, item.start, item.end)} fill={item.color} />
                                    ))
                                )}
                                <circle cx="110" cy="110" r="45" fill="#fff" />
                                <text x="110" y="106" textAnchor="middle" fontSize="12" fill="#6b7280">Total</text>
                                <text x="110" y="126" textAnchor="middle" fontSize="15" fontWeight="700" fill="#111827">{categoryTotal}</text>
                            </svg>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                                {categoryPoints.map((item) => (
                                    <span key={item.label} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                                        <span style={{ width: 10, height: 10, borderRadius: 999, background: item.color, display: "inline-block" }} />
                                        {item.label}: {item.value}
                                    </span>
                                ))}
                            </div>
                        </>
                    )}
                </div>
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
