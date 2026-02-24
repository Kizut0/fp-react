import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ErrorBox from "../../components/ErrorBox";
import Loading from "../../components/Loading";
import StatCard from "../../components/StatCard";
import { contractService } from "../../services/contractService";
import { dashboardService } from "../../services/dashboardService";
import { paymentService } from "../../services/paymentService";
import { proposalService } from "../../services/proposalService";

function toArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

export default function ClientDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const [dashboardData, proposalData, contractData, paymentData] = await Promise.all([
          dashboardService.client(),
          proposalService.list({ mine: "client" }),
          contractService.list({ mine: "client" }),
          paymentService.list(),
        ]);

        setDashboard(dashboardData || {});
        setProposals(toArray(proposalData));
        setContracts(toArray(contractData));
        setPayments(toArray(paymentData));
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const summary = useMemo(() => {
    const submitted = proposals.filter((item) => normalizeStatus(item.status) === "submitted").length;
    const accepted = proposals.filter((item) => normalizeStatus(item.status) === "accepted").length;
    const activeContracts = contracts.filter((item) => normalizeStatus(item.status) === "active").length;
    const paidTotal = payments
      .filter((item) => normalizeStatus(item.status || item.paymentStatus) === "paid")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return { submitted, accepted, activeContracts, paidTotal };
  }, [contracts, payments, proposals]);

  if (loading) return <Loading />;

  return (
    <div className="row">
      <div className="card">
        <div className="h1">Client Dashboard</div>
        <div className="muted">Track hiring pipeline, contracts, and payouts from one place.</div>
      </div>

      <ErrorBox message={error} />

      <div className="grid3">
        <StatCard label="Jobs Posted" value={dashboard?.postedJobs ?? 0} />
        <StatCard label="Open Proposals" value={summary.submitted} />
        <StatCard label="Accepted Proposals" value={summary.accepted} />
      </div>

      <div className="grid3">
        <StatCard label="Active Contracts" value={summary.activeContracts || dashboard?.activeContracts || 0} />
        <StatCard label="Payments Logged" value={dashboard?.paidCount ?? payments.length} />
        <StatCard label="Paid Out (Recorded)" value={formatMoney(summary.paidTotal)} />
      </div>

      <div className="card">
        <div className="h2">Quick Actions</div>
        <div className="quickActions">
          <Link to="/client/jobs/new" className="btn btnOk">Post a New Job</Link>
          <Link to="/client/proposals" className="btn">Review Proposals</Link>
          <Link to="/client/contracts" className="btn">Manage Contracts</Link>
          <Link to="/client/payments" className="btn">Record Payment</Link>
          <Link to="/client/reviews" className="btn">Leave Review</Link>
        </div>
      </div>
    </div>
  );
}
