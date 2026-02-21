import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const ClientJobs = () => {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    // Replace with real API
    setJobs([
      { id: 1, title: "Website Development" },
      { id: 2, title: "Mobile App Design" }
    ]);
  }, []);

  return (
    <div>
      <h2>My Jobs</h2>
      <Link to="/client/jobs/new">Post New Job</Link>
      <ul>
        {jobs.map(job => (
          <li key={job.id}>
            <Link to={`/client/jobs/${job.id}`}>{job.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClientJobs;