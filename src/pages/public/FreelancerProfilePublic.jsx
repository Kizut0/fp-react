import React from "react";
import { useParams } from "react-router-dom";

export default function FreelancerProfilePublic() {
    const { freelancerId } = useParams();
    return (
        <div className="card">
            <div className="h1">Freelancer Profile</div>
            <div className="muted">
                Public profile page placeholder (connect to /api/users/:id if you add it).
            </div>
            <hr className="hr" />
            <div className="muted">Freelancer ID: {freelancerId}</div>
        </div>
    );
}