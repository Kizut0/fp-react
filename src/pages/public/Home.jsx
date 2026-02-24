import { Link } from "react-router-dom";

const featureItems = [
  {
    title: "Verified Talent",
    text: "Review portfolios, ratings, and proposal quality before you hire.",
  },
  {
    title: "Smart Hiring Workflow",
    text: "Post projects, compare proposals, and convert accepted offers into contracts.",
  },
  {
    title: "Payments & Reviews",
    text: "Track milestones, complete payouts, and keep long-term quality with feedback.",
  },
];

const categories = [
  "Web Development",
  "Mobile Apps",
  "UI/UX Design",
  "E-commerce",
  "AI & Data",
  "DevOps",
];

export default function Home() {
  return (
    <div className="row max-w-5xl mx-auto p-6">
      <div className="card">
        <h1 className="text-4xl font-bold" style={{ marginTop: 0, marginBottom: 10 }}>
          Build Faster With Trusted Freelancers
        </h1>

        <p className="text-gray-600 max-w-xl" style={{ marginTop: 0 }}>
          Freelance Hub helps clients ship projects quickly and helps freelancers win quality work with transparent budgets and clear scopes.
        </p>

        <div className="flex gap-3" style={{ marginTop: 14 }}>
          <Link to="/jobs" className="btn btnOk">
            Browse Jobs
          </Link>
          <Link to="/register" className="btn">
            Create Account
          </Link>
        </div>
      </div>

      <div className="grid3">
        {featureItems.map((item) => (
          <div key={item.title} className="card">
            <div className="h2">{item.title}</div>
            <div className="muted">{item.text}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="h2">Popular Categories</div>
        <div className="muted" style={{ marginBottom: 10 }}>
          Explore active opportunities across the most in-demand freelance services.
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {categories.map((item) => (
            <span key={item} className="badge">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
