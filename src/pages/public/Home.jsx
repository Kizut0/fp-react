import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
    return (
        <div className="row">
            <div className="card">
                <div className="h1">Freelance Link</div>
                <div className="muted">
                    A simple freelancer hiring platform focusing on job posting, proposals, hiring/contracts, payments, and reviews.
                </div>
                <hr className="hr" />
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link className="btn" to="/jobs">Browse Jobs</Link>
                    <Link className="btn btnGhost" to="/register">Create Account</Link>
                </div>
            </div>

            <div className="grid3">
                <div className="card">
                    <div className="h2">Client</div>
                    <div className="muted">Post jobs, review proposals, hire, track contracts, pay, and review.</div>
                </div>
                <div className="card">
                    <div className="h2">Freelancer</div>
                    <div className="muted">Browse jobs, submit proposals, track contracts, and build ratings.</div>
                </div>
                <div className="card">
                    <div className="h2">Admin</div>
                    <div className="muted">Monitor users and content, handle disputes, and moderate the platform.</div>
                </div>
            </div>
        </div>
    );
}