import React from "react";
import { Link } from "react-router-dom";

const ClientDashboard = () => {
  return (
    <div>
      <h2>Client Dashboard</h2>
      <ul>
        <li><Link to="/client/jobs">My Jobs</Link></li>
        <li><Link to="/client/proposals">Proposals</Link></li>
        <li><Link to="/client/contracts">Contracts</Link></li>
        <li><Link to="/client/payments">Payments</Link></li>
        <li><Link to="/client/reviews">Reviews</Link></li>
      </ul>
    </div>
  );
};

export default ClientDashboard;