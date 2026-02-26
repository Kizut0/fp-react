import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ErrorBox from "../../components/ErrorBox";
import Loading from "../../components/Loading";
import { jobService } from "../../services/jobService";

const DRAFT_KEY = "client_job_create_draft_v2";

const CATEGORY_OPTIONS = [
  "Web Development",
  "Mobile Development",
  "UI/UX Design",
  "E-commerce",
  "Data & AI",
  "DevOps & Cloud",
  "Content Writing",
  "Digital Marketing",
];

const EXPERIENCE_OPTIONS = ["Entry", "Intermediate", "Expert"];
const PROJECT_TYPE_OPTIONS = ["Fixed", "Hourly"];
const DURATION_OPTIONS = [
  "Less than 1 month",
  "1 to 3 months",
  "3 to 6 months",
  "More than 6 months",
];
const LOCATION_OPTIONS = ["Remote", "Hybrid", "On-site"];
const CREATE_STATUS_OPTIONS = ["draft", "open"];
const EDIT_STATUS_OPTIONS = ["open", "cancelled"];

const DEFAULT_FORM = {
  title: "",
  description: "",
  budget: "",
  status: "draft",
  category: "Web Development",
  skills: "",
  experienceLevel: "Intermediate",
  projectType: "Fixed",
  duration: "1 to 3 months",
  locationType: "Remote",
};

function normalizeJobStatus(value, fallback = "open") {
  const raw = String(value || fallback).trim().toLowerCase();
  if (raw === "closed") return "cancelled";
  if (["draft", "open", "in_progress", "completed", "cancelled"].includes(raw)) return raw;
  return fallback;
}

function formatStatusLabel(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseSkillsInput(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function skillsToText(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return String(value || "");
}

export default function ClientJobEditor({ mode = "create" }) {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const isCreate = mode === "create";

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const [form, setForm] = useState(DEFAULT_FORM);

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
          status: normalizeJobStatus(data?.status, "open"),
          category: data?.category || "Web Development",
          skills: skillsToText(data?.skills),
          experienceLevel: data?.experienceLevel || "Intermediate",
          projectType: data?.projectType || "Fixed",
          duration: data?.duration || "1 to 3 months",
          locationType: data?.locationType || "Remote",
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
    const skills = parseSkillsInput(form.skills);
    const status = normalizeJobStatus(form.status, isCreate ? "draft" : "open");

    const titleOk = titleLen >= 6;
    const descOk = descLen >= 30;
    const budgetOk = Number.isFinite(budgetNum) && budgetNum > 0;
    const skillsOk = skills.length >= 1;
    const statusOk = isCreate
      ? CREATE_STATUS_OPTIONS.includes(status)
      : EDIT_STATUS_OPTIONS.includes(status);

    return {
      titleLen,
      descLen,
      budgetNum,
      skills,
      skillsCount: skills.length,
      status,
      titleOk,
      descOk,
      budgetOk,
      skillsOk,
      statusOk,
      canSubmit: titleOk && descOk && budgetOk && skillsOk && statusOk && !saving,
    };
  }, [form, isCreate, saving]);

  const handleChange = (e) => {
    setTouched(true);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const clearDraft = () => {
    setForm(DEFAULT_FORM);
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
        status: validation.status,
        category: form.category,
        skills: validation.skills,
        experienceLevel: form.experienceLevel,
        projectType: form.projectType,
        duration: form.duration,
        locationType: form.locationType,
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
            ? "Define your project scope clearly to attract better freelancer proposals."
            : "Keep your project details up to date so freelancers can respond accurately."}
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
                placeholder="e.g. Build a multi-tenant SaaS admin dashboard"
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
                placeholder="Include project goals, deliverables, preferred stack, milestones, and communication expectations."
                required
              />
              <div className="text-sm mt-1 text-gray-500">{validation.descLen}/2000</div>
              {touched && !validation.descOk && (
                <div className="text-sm text-red-600 mt-1">Use at least 30 characters.</div>
              )}
            </div>

            <div className="grid2">
              <div>
                <label className="block mb-1">Budget (THB)</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  name="budget"
                  value={form.budget}
                  onChange={handleChange}
                  placeholder="1500"
                  required
                />
                {touched && !validation.budgetOk && (
                  <div className="text-sm text-red-600 mt-1">Enter a valid amount greater than 0.</div>
                )}
              </div>

              <div>
                <label className="block mb-1">Status</label>
                <select className="input" name="status" value={form.status} onChange={handleChange}>
                  {isCreate ? (
                    CREATE_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {formatStatusLabel(status)}
                      </option>
                    ))
                  ) : (
                    <>
                      {!EDIT_STATUS_OPTIONS.includes(validation.status) && (
                        <option value={validation.status}>{formatStatusLabel(validation.status)}</option>
                      )}
                      {EDIT_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {formatStatusLabel(status)}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {touched && !validation.statusOk && (
                  <div className="text-sm text-red-600 mt-1">Invalid status for this action.</div>
                )}
              </div>
            </div>

            <div className="grid2">
              <div>
                <label className="block mb-1">Category</label>
                <select className="input" name="category" value={form.category} onChange={handleChange}>
                  {CATEGORY_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1">Experience Level</label>
                <select
                  className="input"
                  name="experienceLevel"
                  value={form.experienceLevel}
                  onChange={handleChange}
                >
                  {EXPERIENCE_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid2">
              <div>
                <label className="block mb-1">Project Type</label>
                <select className="input" name="projectType" value={form.projectType} onChange={handleChange}>
                  {PROJECT_TYPE_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1">Duration</label>
                <select className="input" name="duration" value={form.duration} onChange={handleChange}>
                  {DURATION_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid2">
              <div>
                <label className="block mb-1">Work Location</label>
                <select className="input" name="locationType" value={form.locationType} onChange={handleChange}>
                  {LOCATION_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1">Skills (comma separated)</label>
                <input
                  className="input"
                  name="skills"
                  value={form.skills}
                  onChange={handleChange}
                  placeholder="React, TypeScript, Node.js, Stripe"
                  required
                />
                <div className="text-sm mt-1 text-gray-500">{validation.skillsCount} skills parsed</div>
                {touched && !validation.skillsOk && (
                  <div className="text-sm text-red-600 mt-1">Add at least one skill.</div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn btnOk" disabled={!validation.canSubmit}>
                {saving ? (isCreate ? "Creating..." : "Saving...") : isCreate ? "Create Job" : "Save Changes"}
              </button>
              <Link to="/client/jobs" className="btn">
                Back
              </Link>
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
          <div className="muted">This is how freelancers will see your job post.</div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="text-lg font-semibold">{form.title.trim() || "Your job title"}</div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 10,
                marginBottom: 10,
              }}
            >
              <span className="badge">{form.category}</span>
              <span className="badge">{form.experienceLevel}</span>
              <span className="badge">{form.projectType}</span>
              <span className="badge">{form.duration}</span>
              <span className="badge">{form.locationType}</span>
            </div>

            <div className="muted" style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
              {form.description.trim() || "Your project description preview will appear here."}
            </div>

            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {validation.skills.map((skill) => (
                <span key={skill} className="badge">
                  {skill}
                </span>
              ))}
            </div>

            <div style={{ marginTop: 14 }}>
              <span className="badge">
                Budget: {validation.budgetOk ? `$${validation.budgetNum.toLocaleString("en-US")}` : "-"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
