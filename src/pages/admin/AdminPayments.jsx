import React, { useEffect, useMemo, useState } from "react";
import Loading from "../../components/Loading";
import ErrorBox from "../../components/ErrorBox";
import { adminService } from "../../services/adminService";
import { paymentService } from "../../services/paymentService";
import {
  isSettledPaymentStatus,
  normalizePaymentStatus,
} from "../../services/paymentStatus";

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
  return String(payment?.dispute?.status || "none").trim().toLowerCase() || "none";
}

function hasOpenDispute(payment) {
  const disputeStatus = getDisputeStatus(payment);
  if (disputeStatus === "open") return true;
  return normalizePaymentStatus(payment?.status || payment?.paymentStatus, "unknown") === "disputed";
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
    const out = {
      reserved: 0,
      in_review: 0,
      released: 0,
      withdrawn: 0,
      failed: 0,
      disputed: 0,
      refunded: 0,
      amount: 0,
    };
    items.forEach((item) => {
      const status = normalizePaymentStatus(item.status || item.paymentStatus, "unknown");
      if (out[status] !== undefined) out[status] += 1;
      if (isSettledPaymentStatus(status)) out.amount += Number(item.amount || 0);
    });
    return out;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const status = normalizePaymentStatus(item.status || item.paymentStatus, "unknown");
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
            Total: {items.length} • Reserved: {totals.reserved} • In Review: {totals.in_review} • Disputed: {totals.disputed} • Released: {totals.released} • Withdrawn: {totals.withdrawn} • Refunded: {totals.refunded} • Settled volume: {formatMoney(totals.amount)}
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
              const status = normalizePaymentStatus(p.status || p.paymentStatus, "unknown");

              return (
                <tr key={id || `${p.contractId}-${p.clientId}-${p.freelancerId}`}>
                  <td>{p.contractId}</td>
                  <td>{p.clientName || p.clientId}</td>
                  <td>{p.freelancerName || p.freelancerId}</td>
                  <td>{formatMoney(p.amount)}</td>
                  <td><span className="badge">{formatStatusLabel(status)}</span></td>
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
                      <button
                        type="button"
                        className="btn btnDanger"
                        disabled={busy}
                        onClick={async () => {
                          if (!window.confirm("Void/Delete this payment? This cannot be undone.")) return;
                          setBusyId(id);
                          try {
                            await paymentService.remove(id);
                            await load();
                          } finally { setBusyId(""); }
                        }}
                      >
                        Delete
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
