import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ErrorBox from "../../components/ErrorBox";
import Loading from "../../components/Loading";
import StatCard from "../../components/StatCard";
import { contractService } from "../../services/contractService";
import { dashboardService } from "../../services/dashboardService";
import { paymentService } from "../../services/paymentService";
import { isSettledPaymentStatus, normalizePaymentStatus } from "../../services/paymentStatus";
import { proposalService } from "../../services/proposalService";
import { reviewService } from "../../services/reviewService";

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
        currency: "THB",
        maximumFractionDigits: 0,
    }).format(Number.isFinite(amount) ? amount : 0);
}

export default function FreelancerDashboard() {
    const [data, setData] = useState({});
    const [proposals, setProposals] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [payments, setPayments] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const run = async () => {
            setLoading(true); setErr(null);
            try {
                const [dashboardData, proposalData, contractData, paymentData, reviewData] = await Promise.all([
                    dashboardService.freelancer(),
                    proposalService.list({ mine: "freelancer" }),
                    contractService.list({ mine: "freelancer" }),
                    paymentService.list({ mine: "freelancer" }),
                    reviewService.list({ mine: "freelancer" }),
                ]);

                setData(dashboardData || {});
                setProposals(toArray(proposalData));
                setContracts(toArray(contractData));
                setPayments(toArray(paymentData));
                setReviews(toArray(reviewData));
            } catch (e) {
                setErr(e);
            } finally {
                setLoading(false);
            }
        };
        run();
    }, []);

    if (loading) return <Loading />;

    const submitted = proposals.filter((item) => normalizeStatus(item.status) === "submitted").length;
    const accepted = proposals.filter((item) => normalizeStatus(item.status) === "accepted").length;
    const successRate = proposals.length > 0 ? Math.round((accepted / proposals.length) * 100) : 0;
    const activeContracts = contracts.filter((item) => normalizeStatus(item.status) === "active").length;
    const completedContracts = contracts.filter((item) => normalizeStatus(item.status) === "completed").length;
    const paidTotal = payments
        .filter((item) => isSettledPaymentStatus(normalizePaymentStatus(item.status || item.paymentStatus, "unknown")))
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length).toFixed(1)
        : data?.avgRating || "-";

    return (
        <div className="row">
            <div className="card">
                <div className="h1">Freelancer Dashboard</div>
                <div className="muted">Track your pipeline from job discovery to contract completion.</div>
            </div>

            <ErrorBox error={err} />

            <div className="grid3">
                <StatCard label="Jobs Applied" value={data?.jobsApplied ?? proposals.length} />
                <StatCard label="Open Proposals" value={submitted} />
                <StatCard label="Proposal Success Rate" value={`${successRate}%`} />
            </div>

            <div className="grid3">
                <StatCard label="Active Contracts" value={activeContracts || data?.activeContracts || 0} />
                <StatCard label="Completed Contracts" value={completedContracts} />
                <StatCard label="Paid Earnings (Logged)" value={formatMoney(paidTotal)} />
            </div>

            <div className="grid3">
                <StatCard label="Avg Rating" value={avgRating} />
                <StatCard label="Total Reviews" value={reviews.length} />
                <StatCard label="Popular Job Categories" value={(data?.popularCategories || []).join(", ") || "-"} />
            </div>

            <div className="card">
                <div className="h2">Quick Actions</div>
                <div className="quickActions">
                    <Link to="/freelancer/browse" className="btn btnOk">Browse Jobs</Link>
                    <Link to="/freelancer/proposals" className="btn">Manage Proposals</Link>
                    <Link to="/freelancer/contracts" className="btn">Open Contracts</Link>
                    <Link to="/freelancer/payments" className="btn">Payment History</Link>
                    <Link to="/freelancer/reviews" className="btn">View Reviews</Link>
                </div>
            </div>
        </div>
    );
}
