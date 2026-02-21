import React, { useEffect, useState } from "react";

import Loading from "../../components/Loading";

import ErrorBox from "../../components/ErrorBox";

import { proposalService } from "../../services/proposalService";

export default function ClientProposals() {

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);

  const [err, setErr] = useState(null);

  useEffect(() => {

    const run = async () => {

      setLoading(true); setErr(null);

      try {

        const data = await proposalService.list("forClient=1");

        setItems(data?.items || data || []);

      } catch (e) {

        setErr(e);

      } finally {

        setLoading(false);

      }

    };

    run();

  }, []);

  if (loading) return <Loading />;

  return (
    <div className="row">
      <div className="card">
        <div className="h1">Proposals</div>
        <div className="muted">All proposals submitted to your jobs.</div>
      </div>
      <ErrorBox error={err} />
      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Job</th><th>Freelancer</th><th>Price</th><th>Status</th></tr>
          </thead>
          <tbody>

            {items.map((p) => (
              <tr key={p._id || p.proposalId}>
                <td>{p.jobTitle || p.jobId}</td>
                <td>{p.freelancerName || p.freelancerId}</td>
                <td>{p.price}</td>
                <td><span className="badge">{p.status || "submitted"}</span></td>
              </tr>

            ))}

            {items.length === 0 && <tr><td colSpan="4" className="muted">No proposals.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>

  );

}
