import React, { useEffect, useMemo, useState } from "react";
import Loading from "../../components/Loading";
import ErrorBox from "../../components/ErrorBox";
import { adminService } from "../../services/adminService";
import { paymentService } from "../../services/paymentService";

function normalizeStatus(value, fallback = "unknown") {
  const raw = String(value || fallback).trim().toLowerCase();
  return raw || fallback;
}

function formatStatusLabel(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
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

function getDisputeStatus(payment) {
  return normalizeStatus(payment?.dispute?.status, "none");
}

function hasOpenDispute(payment) {
  const disputeStatus = getDisputeStatus(payment);
  if (disputeStatus === "open") return true;
  return normalizeStatus(payment?.status || payment?.paymentStatus) === "disputed";
}

function renderDisputeInfo(payment) {
  const disputeStatus = getDisputeStatus(payment);
  if (disputeStatus === "none") return "-";

  const reason = String(payment?.dispute?.reason || "").trim();
  const resolution = String(payment?.dispute?.resolution || "").trim();
  const resolutionNote = String(payment?.dispute?.resolutionNote || "").trim();

  if (disputeStatus === "open") {
    return reason ? `Open: ${reason}` : "Open";
  }

  if (resolution) {
    return resolutionNote
      ? `Resolved: ${resolution} (${resolutionNote})`
      : `Resolved: ${resolution}`;
  }

  return "Resolved";
}

export default function AdminPayments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await adminService.payments.list();
      setItems(data?.items || data || []);
    } catch (e) {
      setErr(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totals = useMemo(() => {
    const out = { hold: 0, pending: 0, paid: 0, failed: 0, disputed: 0, refunded: 0, amount: 0 };
    items.forEach((item) => {
      const status = normalizeStatus(item.status || item.paymentStatus);
      if (out[status] !== undefined) out[status] += 1;
      if (status === "paid") out.amount += Number(item.amount || 0);
    });
    return out;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const status = normalizeStatus(item.status || item.paymentStatus);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!q) return true;

      const fields = [
        item.contractId,
        item.clientId,
        item.clientName,
        item.freelancerId,
        item.freelancerName,
        item.note,
        item.dispute?.reason,
        item.dispute?.resolutionNote,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");

      return fields.includes(q);
    });
  }, [items, query, statusFilter]);

  const resolveDispute = async (payment, resolution) => {
    const paymentId = String(payment?._id || payment?.paymentId || "").trim();
    if (!paymentId || !hasOpenDispute(payment)) return;

    const note = window.prompt(
      resolution === "release"
        ? "Resolution note for release (optional):"
        : "Resolution note for refund (optional):",
      ""
    ) || "";

    setBusyId(paymentId);
    setErr(null);
    try {
      await paymentService.resolve({ paymentId, resolution, note: note.trim() });
      await load();
    } catch (e) {
      setErr(e);
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <Loading />;

  const formatMoney = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0,
    }).format(Number.isFinite(Number(value)) ? Number(value) : 0);

  return (
    <div className="row">
      <div className="card">
        <div className="h1">Payments Monitor</div>
        <div className="muted">Admin can resolve disputed held payments with release/refund decisions.</div>
      </div>
      <ErrorBox error={err} />
      <div className="card">
        <div className="flex justify-between items-center" style={{ gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
          <div className="muted">
            Total: {items.length} • Hold: {totals.hold} • Pending: {totals.pending} • Disputed: {totals.disputed} • Paid: {totals.paid} • Refunded: {totals.refunded} • Paid volume: {formatMoney(totals.amount)}
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
              <option value="hold">Hold</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
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
              <th>Client</th>
              <th>Freelancer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Dispute</th>
              <th>Date</th>
              <th style={{ width: 220 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const id = String(p._id || p.paymentId || "").trim();
              const isOpenDispute = hasOpenDispute(p);
              const busy = busyId === id;

              return (
                <tr key={id || `${p.contractId}-${p.clientId}-${p.freelancerId}`}>
                  <td>{p.contractId}</td>
                  <td>{p.clientName || p.clientId}</td>
                  <td>{p.freelancerName || p.freelancerId}</td>
                  <td>{formatMoney(p.amount)}</td>
                  <td><span className="badge">{formatStatusLabel(normalizeStatus(p.status || p.paymentStatus))}</span></td>
                  <td style={{ whiteSpace: "pre-wrap" }}>{renderDisputeInfo(p)}</td>
                  <td className="muted">{formatDateTime(p.createdAt || p.paymentDate || p.updatedAt)}</td>
                  <td>
                    <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn btnOk"
                        disabled={!isOpenDispute || busy}
                        onClick={() => resolveDispute(p, "release")}
                      >
                        Release
                      </button>
                      <button
                        type="button"
                        className="btn btnDanger"
                        disabled={!isOpenDispute || busy}
                        onClick={() => resolveDispute(p, "refund")}
                      >
                        Refund
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="8" className="muted">No payments found for this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
