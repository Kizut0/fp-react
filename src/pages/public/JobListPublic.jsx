import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { jobService } from "../../services/jobService";

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

const INITIAL_FILTERS = {
  q: "",
  category: "all",
  experienceLevel: "all",
  projectType: "all",
  minBudget: "",
  maxBudget: "",
  sort: "newest",
};

function toJobsArray(data) {
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

function getPostedAtValue(job) {
  if (!job || typeof job !== "object") return null;

  const direct = job.createdAt || job.postedAt || job.postedDate || job.created_on || job.date;
  if (direct) return direct;

  const id = String(job._id || job.jobId || "").trim();
  if (/^[a-f\d]{24}$/i.test(id)) {
    const seconds = Number.parseInt(id.slice(0, 8), 16);
    return new Date(seconds * 1000);
  }

  return null;
}

function formatPostedAt(value) {
  if (!value) return "recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function JobListPublic() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.q.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [filters.q]);

  const requestFilters = useMemo(
    () => ({
      q: debouncedQuery,
      category: filters.category,
      experienceLevel: filters.experienceLevel,
      projectType: filters.projectType,
      minBudget: filters.minBudget,
      maxBudget: filters.maxBudget,
      sort: filters.sort,
    }),
    [
      debouncedQuery,
      filters.category,
      filters.experienceLevel,
      filters.projectType,
      filters.minBudget,
      filters.maxBudget,
      filters.sort,
    ]
  );

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await jobService.getAll(requestFilters);
        setJobs(toJobsArray(data));
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load jobs.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [requestFilters]);

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (key === "sort") return count;
      if (value === "" || value === "all") return count;
      return count + 1;
    }, 0);
  }, [filters]);

  const setFilterValue = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setDebouncedQuery("");
  };

  if (loading) return <p className="p-6">Loading jobs...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="row max-w-5xl mx-auto p-6">
      <div className="card">
        <div className="h1">Find Freelance Jobs</div>
        <div className="muted">
          Browse active projects posted by real clients and filter by budget, skill level, and engagement type.
        </div>
      </div>

      <div className="card">
        <div className="h2">Search & Filters</div>
        <div className="grid3">
          <div>
            <label className="block mb-1">Keyword</label>
            <input
              className="input"
              placeholder="React, dashboard, API integration..."
              value={filters.q}
              onChange={(e) => setFilterValue("q", e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1">Category</label>
            <select
              className="input"
              value={filters.category}
              onChange={(e) => setFilterValue("category", e.target.value)}
            >
              <option value="all">All categories</option>
              {CATEGORY_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1">Experience</label>
            <select
              className="input"
              value={filters.experienceLevel}
              onChange={(e) => setFilterValue("experienceLevel", e.target.value)}
            >
              <option value="all">All levels</option>
              {EXPERIENCE_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1">Project Type</label>
            <select
              className="input"
              value={filters.projectType}
              onChange={(e) => setFilterValue("projectType", e.target.value)}
            >
              <option value="all">All types</option>
              {PROJECT_TYPE_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1">Min Budget (THB)</label>
            <input
              className="input"
              type="number"
              min="0"
              placeholder="500"
              value={filters.minBudget}
              onChange={(e) => setFilterValue("minBudget", e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1">Max Budget (THB)</label>
            <input
              className="input"
              type="number"
              min="0"
              placeholder="10000"
              value={filters.maxBudget}
              onChange={(e) => setFilterValue("maxBudget", e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1">Sort By</label>
            <select
              className="input"
              value={filters.sort}
              onChange={(e) => setFilterValue("sort", e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="budgetHigh">Budget: High to Low</option>
              <option value="budgetLow">Budget: Low to High</option>
              <option value="mostProposals">Most Proposals</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3" style={{ marginTop: 12 }}>
          <button type="button" className="btn" onClick={clearFilters}>
            Reset Filters
          </button>
          <span className="muted">
            {jobs.length} results{activeFilterCount > 0 ? ` • ${activeFilterCount} active filters` : ""}
          </span>
        </div>
      </div>

      <div className="row">
        {jobs.length === 0 && (
          <div className="card">
            <div className="h2">No matching jobs</div>
            <div className="muted">Try broadening your filters or removing budget constraints.</div>
          </div>
        )}

        {jobs.map((job) => (
          <div key={job._id || job.jobId} className="card">
            <div className="flex justify-between items-center" style={{ gap: 12 }}>
              <h2 className="text-xl font-semibold" style={{ margin: 0 }}>
                {job.title}
              </h2>
              <span className="badge" style={{ fontWeight: 600 }}>
                {formatMoney(job.budget)}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 10,
                marginBottom: 10,
              }}
            >
              <span className="badge">{job.category || "General"}</span>
              <span className="badge">{job.experienceLevel || "Intermediate"}</span>
              <span className="badge">{job.projectType || "Fixed"}</span>
              <span className="badge">{job.locationType || "Remote"}</span>
              <span className="badge">{job.duration || "1 to 3 months"}</span>
            </div>

            <p className="text-gray-700" style={{ margin: 0 }}>
              {String(job.description || "").slice(0, 220)}
              {String(job.description || "").length > 220 ? "..." : ""}
            </p>

            {Array.isArray(job.skills) && job.skills.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                {job.skills.slice(0, 8).map((skill) => (
                  <span key={skill} className="badge">
                    {skill}
                  </span>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center" style={{ marginTop: 14, gap: 12 }}>
              <span className="muted">
                Posted {formatPostedAt(getPostedAtValue(job))} • {Number(job.proposalsCount || 0)} proposals
              </span>

              <Link to={`/jobs/${job._id || job.jobId}`} className="btn btnOk">
                View Job
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
