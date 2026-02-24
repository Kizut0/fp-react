import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import ErrorBox from "../../components/ErrorBox";
import Loading from "../../components/Loading";
import { jobService } from "../../services/jobService";
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
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function normalizeStatus(value) {
  return String(value || "submitted").toLowerCase();
}

export default function MyProposals() {
  const location = useLocation();
  const prefillJob = location.state?.createForJob;

  const [jobs, setJobs] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState({
    jobId: prefillJob?._id || prefillJob?.jobId || "",
    price: "",
    message: "",
  });

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [proposalData, jobData] = await Promise.all([
        proposalService.list({ mine: "freelancer" }),
        jobService.getAll({ status: "open", sort: "newest" }),
      ]);

      setItems(toArray(proposalData));
      setJobs(toArray(jobData));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const canSubmit = useMemo(() => {
    const price = Number(form.price || 0);
    return (
      String(form.jobId || "").trim().length > 0 &&
      Number.isFinite(price) &&
      price > 0 &&
      String(form.message || "").trim().length >= 20
    );
  }, [form]);

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setError("");

    try {
      const payload = {
        jobId: String(form.jobId || "").trim(),
        price: Number(form.price || 0),
        message: String(form.message || "").trim(),
      };

      if (editingId) {
        await proposalService.update(editingId, payload);
      } else {
        await proposalService.create(payload);
      }

      setEditingId("");
      setForm((prev) => ({ ...prev, price: "", message: "" }));
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (proposal) => {
    setEditingId(proposal._id || proposal.proposalId);
    setForm({
      jobId: String(proposal.jobId || ""),
      price: String(proposal.price || ""),
      message: String(proposal.message || ""),
    });
  };

  const cancelEdit = () => {
    setEditingId("");
    setForm({
      jobId: prefillJob?._id || prefillJob?.jobId || "",
      price: "",
      message: "",
    });
  };

  const withdraw = async (proposalId) => {
    const confirmed = window.confirm("Withdraw this proposal?");
    if (!confirmed) return;

    setSaving(true);
    setError("");
    try {
      await proposalService.remove(proposalId);
      if (editingId === proposalId) cancelEdit();
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const proposalStats = useMemo(() => {
    const out = { submitted: 0, accepted: 0, rejected: 0, withdrawn: 0 };
    for (const item of items) {
      const status = normalizeStatus(item.status);
      if (out[status] !== undefined) out[status] += 1;
    }
    return out;
  }, [items]);

  if (loading) return <Loading />;

  return (
    <div className="row">
      <div className="card">
        <div className="h1">My Proposals</div>
        <div className="muted">Submit, edit, and track proposal outcomes with realistic bid details.</div>
      </div>

      <ErrorBox message={error} />

      <div className="card">
        <div className="h2">{editingId ? "Edit Proposal" : "Submit Proposal"}</div>
        {prefillJob && (
          <div className="muted" style={{ marginBottom: 10 }}>
            Suggested job from detail page: <b>{prefillJob.title}</b>
          </div>
        )}

        <form className="row" onSubmit={submit}>
          <div className="grid2">
            <div>
              <label className="block mb-1">Job</label>
              <select
                className="input"
                value={form.jobId}
                onChange={(e) => setForm((prev) => ({ ...prev, jobId: e.target.value }))}
                disabled={Boolean(editingId)}
              >
                <option value="">Select an open job</option>
                {jobs.map((job) => (
                  <option key={job._id || job.jobId} value={job._id || job.jobId}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1">Bid Price (USD)</label>
              <input
                className="input"
                type="number"
                min="1"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="1200"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1">Proposal Message</label>
            <textarea
              className="textarea"
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="Describe scope, milestones, timeline, and why you're a fit (min 20 chars)."
            />
            <div className="muted" style={{ marginTop: 6 }}>
              {String(form.message || "").trim().length} / 20 minimum characters
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn btnOk" disabled={!canSubmit || saving}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Submit Proposal"}
            </button>

            {editingId && (
              <button type="button" className="btn" onClick={cancelEdit} disabled={saving}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <div className="muted" style={{ marginBottom: 8 }}>
          Total: {items.length} • Submitted: {proposalStats.submitted} • Accepted: {proposalStats.accepted} • Rejected: {proposalStats.rejected}
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Bid</th>
              <th>Status</th>
              <th>Date</th>
              <th>Message</th>
              <th style={{ width: 240 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((proposal) => {
              const id = proposal._id || proposal.proposalId;
              const status = normalizeStatus(proposal.status);
              const editable = status === "submitted";

              return (
                <tr key={id}>
                  <td>{proposal.jobTitle || proposal.jobId}</td>
                  <td>{formatMoney(proposal.price)}</td>
                  <td>
                    <span className="badge">{status}</span>
                  </td>
                  <td>{formatDate(proposal.createdAt)}</td>
                  <td style={{ maxWidth: 360, whiteSpace: "pre-wrap" }}>{proposal.message || "-"}</td>
                  <td>
                    <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn"
                        disabled={!editable || saving}
                        onClick={() => startEdit(proposal)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="btn btnDanger"
                        disabled={saving}
                        onClick={() => withdraw(id)}
                      >
                        Withdraw
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {items.length === 0 && (
              <tr>
                <td colSpan="6" className="muted">
                  No proposals yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
