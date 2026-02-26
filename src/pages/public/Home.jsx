import { Link } from "react-router-dom";

const topMenu = ["About", "Services", "Projects", "Plans", "Blog", "Contact"];

const stats = [
  { value: "350+", label: "Active Projects" },
  { value: "150+", label: "Verified Clients" },
  { value: "95%", label: "Success Rate" },
  { value: "8+", label: "Years Combined Ops" },
];

const services = [
  "Branding and identity design",
  "Social media graphic",
  "Web design",
  "UI design",
  "Illustration",
  "Motion graphics",
];

const categories = ["Web Development", "Mobile Apps", "UI/UX Design", "E-commerce", "AI & Data", "DevOps"];

export default function Home() {
  return (
    <div className="row max-w-5xl mx-auto p-6">
      <section className="card homePortfolio">
        <div className="homePortfolioTop">
          <div className="homePortfolioLogo">FH.</div>
          <div className="homePortfolioMenu">
            {topMenu.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <div className="homePortfolioHero">
          <h1 className="homePortfolioTitle">HELLO THERE, BUILD WITH FREELANCE HUB!</h1>
          <p className="homePortfolioIntro">
            A practical freelance platform for hiring, delivery, and payment flow from proposal to completion.
          </p>
        </div>

        <div className="homePortfolioStats">
          {stats.map((item) => (
            <div key={item.value} className="homePortfolioStat">
              <div className="homePortfolioStatValue">{item.value}</div>
              <div className="homePortfolioStatLabel">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="homePortfolioStory">
          <div>
            <div className="homePortfolioStoryTitle">GET TO KNOW MORE</div>
          </div>
          <div>
            <p className="homePortfolioStoryText">
              As a product-focused team, we streamline how clients and freelancers collaborate. Post jobs, review proposals, lock contracts, and manage secure payments with clear status at every step.
            </p>
            <div className="quickActions">
              <Link to="/jobs" className="btn btnOk">Browse Jobs</Link>
              <Link to="/register" className="btn">Create Account</Link>
            </div>
          </div>
        </div>

        <div className="homePortfolioServices">
          <div className="homePortfolioServicesNote">
            Designing for a world
            <br />
            of clear delivery.
          </div>
          <div>
            <h2 className="homePortfolioServicesTitle">MY SERVICES</h2>
            <ul className="homePortfolioServiceList">
              {services.map((item) => (
                <li key={item}>
                  <span>{item}</span>
                  <span aria-hidden="true">→</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="homePortfolioBand" />
      </section>

      <section className="card">
        <div className="h2">Popular Categories</div>
        <div className="muted" style={{ marginBottom: 10 }}>Explore active opportunities across in-demand services.</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {categories.map((item) => <span key={item} className="badge">{item}</span>)}
        </div>
      </section>
    </div>
  );
}
