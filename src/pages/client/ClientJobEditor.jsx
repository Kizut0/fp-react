import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ErrorBox from "../../components/ErrorBox";
import Loading from "../../components/Loading";
import { jobService } from "../../services/jobService";

const DRAFT_KEY = "client_job_create_draft_v1";

export default function ClientJobEditor({ mode = "create" }) {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const isCreate = mode === "create";

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    budget: "",
    status: "open",
  });

  useEffect(() => {
    if (!isCreate) return;
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (!draft) return;
      const parsed = JSON.parse(draft);
      setForm((prev) => ({ ...prev, ...parsed }));
    } catch {
      // ignore malformed drafts
    }
  }, [isCreate]);

  useEffect(() => {
    if (!isCreate) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form, isCreate]);

  useEffect(() => {
    if (isCreate || !jobId) return;

    const loadJob = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await jobService.getById(jobId);
        setForm({
          title: data?.title || "",
          description: data?.description || "",
          budget: String(data?.budget || ""),
          status: data?.status || "open",
        });
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || "Failed to load job");
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [isCreate, jobId]);

  const validation = useMemo(() => {
    const titleLen = form.title.trim().length;
    const descLen = form.description.trim().length;
    const budgetNum = Number(form.budget);

    const titleOk = titleLen >= 6;
    const descOk = descLen >= 30;
    const budgetOk = Number.isFinite(budgetNum) && budgetNum > 0;

    return {
      titleLen,
      descLen,
      budgetNum,
      titleOk,
      descOk,
      budgetOk,
      canSubmit: titleOk && descOk && budgetOk && !saving,
    };
  }, [form, saving]);

  const handleChange = (e) => {
    setTouched(true);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const clearDraft = () => {
    setForm({ title: "", description: "", budget: "", status: "open" });
    localStorage.removeItem(DRAFT_KEY);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!validation.canSubmit) return;

    setSaving(true);
    setError("");

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        budget: Number(form.budget),
        status: form.status || "open",
      };

      if (isCreate) {
        await jobService.create(payload);
        localStorage.removeItem(DRAFT_KEY);
      } else {
        await jobService.update(jobId, payload);
      }

      navigate("/client/jobs");
    } catch (e) {
      setError(
        e?.response?.data?.message ||
        e?.message ||
        (isCreate ? "Failed to create job" : "Failed to update job")
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="row">
      <div className="card">
        <div className="h1">{isCreate ? "Create Job" : "Edit Job"}</div>
        <div className="muted">
          {isCreate
            ? "Fill clear details to attract better freelancer proposals."
            : "Update your posting with the latest project information."}
        </div>
      </div>

      <ErrorBox message={error} />

      <div className="grid2">
        <div className="card">
          <form className="row" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-1">Title</label>
              <input
                className="input"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Build a React admin dashboard"
                required
              />
              <div className="text-sm mt-1 text-gray-500">{validation.titleLen}/100</div>
              {touched && !validation.titleOk && (
                <div className="text-sm text-red-600 mt-1">Use at least 6 characters.</div>
              )}
            </div>

            <div>
              <label className="block mb-1">Description</label>
              <textarea
                className="textarea"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Include goals, deliverables, stack preference, and timeline."
                required
              />
              <div className="text-sm mt-1 text-gray-500">{validation.descLen}/1000</div>
              {touched && !validation.descOk && (
                <div className="text-sm text-red-600 mt-1">Use at least 30 characters.</div>
              )}
            </div>

            <div>
              <label className="block mb-1">Budget (USD)</label>
              <input
                className="input"
                type="number"
                min="1"
                name="budget"
                value={form.budget}
                onChange={handleChange}
                placeholder="1000"
                required
              />
              {touched && !validation.budgetOk && (
                <div className="text-sm text-red-600 mt-1">Enter a valid amount greater than 0.</div>
              )}
              {validation.budgetOk && (
                <div className="text-sm mt-1 text-gray-500">
                  Suggested milestone split: ${(validation.budgetNum * 0.3).toFixed(0)} / ${(validation.budgetNum * 0.4).toFixed(0)} / ${(validation.budgetNum * 0.3).toFixed(0)}
                </div>
              )}
            </div>

            {!isCreate && (
              <div>
                <label className="block mb-1">Status</label>
                <select className="input" name="status" value={form.status} onChange={handleChange}>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            )}

            <div className="flex gap-3">
              <button type="submit" className="btn btnOk" disabled={!validation.canSubmit}>
                {saving ? (isCreate ? "Creating..." : "Saving...") : isCreate ? "Create Job" : "Save Changes"}
              </button>
              <Link to="/client/jobs" className="btn">Back</Link>
              {isCreate && (
                <button type="button" className="btn" onClick={clearDraft}>
                  Clear Draft
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card">
          <div className="h2">Live Preview</div>
          <div className="muted">This is how your job appears before publishing.</div>
          <div className="card" style={{ marginTop: 12 }}>
            <div className="text-lg font-semibold">{form.title.trim() || "Your job title"}</div>
            <div className="muted" style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
              {form.description.trim() || "Your job description preview will appear here."}
            </div>
            <div style={{ marginTop: 12 }}>
              <span className="badge">Budget: {validation.budgetOk ? `$${validation.budgetNum}` : "-"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
