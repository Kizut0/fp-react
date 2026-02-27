import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ErrorBox from "../../components/ErrorBox";
import Loading from "../../components/Loading";
import { contractService } from "../../services/contractService";
import { paymentService } from "../../services/paymentService";
import { normalizePaymentStatus } from "../../services/paymentStatus";

function toArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function normalizeId(value) {
  return String(value || "").trim();
}

function formatStatusLabel(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getContractKey(contract) {
  return normalizeId(contract?._id || contract?.contractId);
}

function getPaymentStatus(payment) {
  return normalizePaymentStatus(payment?.status || payment?.paymentStatus, "unknown");
}

function getPaymentDate(payment) {
  return payment?.createdAt || payment?.paymentDate || payment?.updatedAt || null;
}

function getDisputeStatus(payment) {
  return String(payment?.dispute?.status || "none").trim().toLowerCase() || "none";
}

function hasOpenDispute(payment) {
  const disputeStatus = getDisputeStatus(payment);
  if (disputeStatus === "open") return true;
  return getPaymentStatus(payment) === "disputed";
}

function canClientDispute(payment) {
  const status = getPaymentStatus(payment);
  if (!["reserved", "in_review", "released", "disputed"].includes(status)) return false;
  return !hasOpenDispute(payment);
}

function renderDisputeMeta(payment) {
  const reason = String(payment?.dispute?.reason || "").trim();
  const resolution = String(payment?.dispute?.resolution || "").trim();
  const resolutionNote = String(payment?.dispute?.resolutionNote || "").trim();

  if (!reason && !resolution && !resolutionNote) return "";

  const pieces = [];
  if (reason) pieces.push(`Dispute: ${reason}`);
  if (resolution) {
    const resolutionText = resolutionNote
      ? `Resolved: ${resolution}${resolutionNote ? ` (${resolutionNote})` : ""}`
      : `Resolved: ${resolution}`;
    pieces.push(resolutionText);
  }

  return pieces.join(" | ");
}

const DEFAULT_FORM = {
  contractId: "",
  freelancerId: "",
  amount: "",
  status: "reserved",
  note: "",
};

export default function ClientPayments() {
  const location = useLocation();
  const [contracts, setContracts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busyDisputeId, setBusyDisputeId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(DEFAULT_FORM);

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [contractData, paymentData] = await Promise.all([
        contractService.list({ mine: "client" }),
        paymentService.list(),
      ]);

      setContracts(toArray(contractData));
      setPayments(toArray(paymentData));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const contractById = useMemo(() => {
    const out = new Map();
    contracts.forEach((contract) => {
      const id = getContractKey(contract);
      if (id) out.set(id, contract);
      if (normalizeId(contract?.contractId)) out.set(normalizeId(contract.contractId), contract);
    });
    return out;
  }, [contracts]);

  const activeContracts = useMemo(
    () => contracts.filter((contract) => String(contract?.status || "active").toLowerCase() !== "cancelled"),
    [contracts]
  );

  const stats = useMemo(() => {
    const out = {
      reserved: 0,
      in_review: 0,
      released: 0,
      withdrawn: 0,
      failed: 0,
      disputed: 0,
      refunded: 0,
    };
    payments.forEach((payment) => {
      const status = getPaymentStatus(payment);
      if (out[status] !== undefined) out[status] += 1;
    });
    return out;
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const q = query.trim().toLowerCase();

    return payments.filter((payment) => {
      const status = getPaymentStatus(payment);
      if (statusFilter !== "all" && status !== statusFilter) return false;

      if (!q) return true;
      const linkedContract = contractById.get(normalizeId(payment?.contractId)) || null;
      const fields = [
        payment.contractId,
        linkedContract?.jobTitle,
        payment.freelancerId,
        payment.freelancerName,
        payment.note,
        payment.dispute?.reason,
        payment.dispute?.resolutionNote,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");

      return fields.includes(q);
    });
  }, [contractById, payments, query, statusFilter]);

  const selectedContract = useMemo(
    () => contractById.get(normalizeId(form.contractId)) || null,
    [contractById, form.contractId]
  );

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onContractChange = useCallback((value) => {
    const contract = contractById.get(normalizeId(value));

    setForm((prev) => ({
      ...prev,
      contractId: value,
      freelancerId: contract?.freelancerId ? String(contract.freelancerId) : "",
      amount:
        contract && Number.isFinite(Number(contract.amount))
          ? String(contract.amount)
          : "",
    }));
  }, [contractById]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedContractId = normalizeId(params.get("contractId"));
    if (!requestedContractId) return;

    const contract = contractById.get(requestedContractId);
    if (!contract) return;

    onContractChange(requestedContractId);
  }, [contractById, location.search, onContractChange]);

  const createPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const contractId = normalizeId(form.contractId);
      const freelancerId = normalizeId(form.freelancerId);
      const amount = Number(form.amount);
      const status = normalizePaymentStatus(form.status, "reserved");
      const note = String(form.note || "").trim();

      if (!contractId) throw new Error("Contract is required.");
      if (!freelancerId) throw new Error("Freelancer ID is required.");
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be greater than 0.");

      await paymentService.create({
        contractId,
        freelancerId,
        amount,
        status,
        note,
      });

      setForm((prev) => ({ ...DEFAULT_FORM, status: prev.status }));
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const openDispute = async (payment) => {
    const paymentId = normalizeId(payment?._id || payment?.paymentId);
    if (!paymentId || !canClientDispute(payment)) return;

    const reason = window.prompt("Dispute reason (min 10 characters):", "") || "";
    if (!reason.trim()) return;

    setBusyDisputeId(paymentId);
    setError("");
    try {
      await paymentService.dispute({ paymentId, reason: reason.trim() });
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusyDisputeId("");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="row">
      <div className="card">
        <div className="h1">Client Payments</div>
        <div className="muted">Track held payments, open disputes, and final release/refund outcomes.</div>
      </div>

      <ErrorBox message={error} />

      <div className="card">
        <div className="h2">Create Payment</div>
        <div className="muted" style={{ marginBottom: 12 }}>
          Select a contract to auto-fill freelancer and amount.
        </div>

        <form className="row" onSubmit={createPayment}>
          <div className="grid2">
            <div>
              <label className="block mb-1">Contract</label>
              <select
                className="input"
                value={form.contractId}
                onChange={(e) => onContractChange(e.target.value)}
                required
              >
                <option value="">Select contract</option>
                {activeContracts.map((contract) => {
                  const id = getContractKey(contract);
                  if (!id) return null;

                  return (
                    <option key={id} value={id}>
                      {(contract.jobTitle || contract.jobId || "Untitled Project")} • {formatMoney(contract.amount)}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block mb-1">Freelancer ID</label>
              <input
                className="input"
                value={form.freelancerId}
                onChange={(e) => updateForm("freelancerId", e.target.value)}
                placeholder="Freelancer user id"
                required
              />
            </div>

            <div>
              <label className="block mb-1">Amount (THB)</label>
              <input
                className="input"
                type="number"
                min="1"
                value={form.amount}
                onChange={(e) => updateForm("amount", e.target.value)}
                placeholder="Payment amount"
                required
              />
            </div>

            <div>
              <label className="block mb-1">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => updateForm("status", e.target.value)}
              >
                <option value="reserved">Reserved</option>
                <option value="in_review">In Review</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-1">Note</label>
            <textarea
              className="textarea"
              value={form.note}
              onChange={(e) => updateForm("note", e.target.value)}
              placeholder="Optional context such as invoice reference"
            />
          </div>

          <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
            <button type="submit" className="btn btnOk" disabled={submitting}>
              {submitting ? "Saving..." : "Create Payment"}
            </button>
            <Link to="/client/contracts" className="btn">
              Open Contracts
            </Link>
            <Link to="/client/reviews" className="btn">
              Leave Reviews
            </Link>
          </div>
        </form>

        {selectedContract && (
          <div className="muted" style={{ marginTop: 8 }}>
            Selected: {selectedContract.jobTitle || selectedContract.jobId || "Untitled Project"} •
            Freelancer {selectedContract.freelancerName || selectedContract.freelancerId || "-"}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex justify-between items-center" style={{ gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
          <div className="muted">
            Total: {payments.length} • Reserved: {stats.reserved} • In Review: {stats.in_review} • Disputed: {stats.disputed} • Released: {stats.released} • Withdrawn: {stats.withdrawn} • Refunded: {stats.refunded}
          </div>
          <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
            <input
              className="input"
              placeholder="Search payments..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ minWidth: 220 }}
            />
            <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All status</option>
              <option value="reserved">Reserved</option>
              <option value="in_review">In Review</option>
              <option value="released">Released</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="failed">Failed</option>
              <option value="disputed">Disputed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Contract</th>
              <th>Freelancer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Note</th>
              <th>Date</th>
              <th style={{ width: 160 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment, idx) => {
              const id = normalizeId(payment?._id || payment?.paymentId) || `${normalizeId(payment?.contractId)}-${idx}`;
              const linkedContract = contractById.get(normalizeId(payment?.contractId)) || null;
              const status = getPaymentStatus(payment);
              const disputeMeta = renderDisputeMeta(payment);
              const disputeAllowed = canClientDispute(payment);
              const busyDispute = busyDisputeId === id;

              return (
                <tr key={id}>
                  <td>{linkedContract?.jobTitle || payment.contractId || "-"}</td>
                  <td>{payment.freelancerName || payment.freelancerId || linkedContract?.freelancerId || "-"}</td>
                  <td>{formatMoney(payment.amount)}</td>
                  <td>
                    <span className="badge">{formatStatusLabel(status)}</span>
                  </td>
                  <td style={{ maxWidth: 320, whiteSpace: "pre-wrap" }}>
                    {[payment.note || payment.paymentMethod || "-", disputeMeta].filter(Boolean).join("\n")}
                  </td>
                  <td className="muted">{formatDateTime(getPaymentDate(payment))}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btnDanger"
                      disabled={!disputeAllowed || busyDispute}
                      onClick={() => openDispute(payment)}
                    >
                      {busyDispute ? "Opening..." : hasOpenDispute(payment) ? "Disputed" : "Dispute"}
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredPayments.length === 0 && (
              <tr>
                <td colSpan="7" className="muted">
                  No payments match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
