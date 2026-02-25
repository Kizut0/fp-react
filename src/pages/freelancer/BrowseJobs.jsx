import React from "react";
import { Link } from "react-router-dom";
import JobListPublic from "../public/JobListPublic";

export default function BrowseJobs() {
    return (
        <div className="row">
            <div className="card max-w-5xl mx-auto" style={{ width: "100%" }}>
                <div className="h1">Browse Jobs</div>
                <div className="muted">
                    Discover open projects, compare budgets, and submit targeted proposals with clear delivery scope.
                </div>
                <div className="quickActions" style={{ marginTop: 12 }}>
                    <Link to="/freelancer/proposals" className="btn btnOk">
                        My Proposals
                    </Link>
                    <Link to="/freelancer/contracts" className="btn">
                        Active Contracts
                    </Link>
                </div>
            </div>
            <JobListPublic />
        </div>
    );
}
