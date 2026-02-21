import React, { useEffect, useState } from "react";

import { Link, useParams, useNavigate } from "react-router-dom";

import Loading from "../../components/Loading";

import ErrorBox from "../../components/ErrorBox";

import { jobService } from "../../services/jobService";

import { proposalService } from "../../services/proposalService";

import { contractService } from "../../services/contractService";
 
export default function ClientJobDetail() {

  const { jobId } = useParams();

  const nav = useNavigate();

  const [job, setJob] = useState(null);

  const [proposals, setProposals] = useState([]);

  const [loading, setLoading] = useState(true);

  const [err, setErr] = useState(null);

  const [busyId, setBusyId] = useState("");
 
  const load = async () => {

    setLoading(true); setErr(null);

    try {

      const j = await jobService.get(jobId);

      const ps = await proposalService.list(`jobId=${jobId}`);

      setJob(j);

      setProposals(ps?.items || ps || []);

    } catch (e) {

      setErr(e);

    } finally {

      setLoading(false);

    }

  };
 
  useEffect(() => { load(); }, [jobId]);
 
  const setProposalStatus = async (proposalId, status) => {

    setBusyId(proposalId);

    try {

      await proposalService.updateStatus(proposalId, status);

      await load();

    } finally {

      setBusyId("");

    }

  };
 
  const hire = async (proposal) => {

    setBusyId(proposal._id || proposal.proposalId);

    try {

      // create contract from accepted proposal

      const created = await contractService.create({

        jobId,

        proposalId: proposal._id || proposal.proposalId,

        freelancerId: proposal.freelancerId,

        startDate: new Date().toISOString(),

        status: "active",

      });

      await load();

      nav("/client/contracts", { state: { highlight: created._id || created.contractId } });

    } catch (e) {

      setErr(e);

    } finally {

      setBusyId("");

    }

  };
 
  if (loading) return <Loading />;
 
  return (
<div className="row">
<ErrorBox error={err} />
 
      {job && (
<div className="card">
<div className="h1">{job.title}</div>
<div className="muted">Budget: {job.budget} | Status: <span className="badge">{job.status || "open"}</span></div>
<hr className="hr" />
<div style={{ whiteSpace: "pre-wrap" }}>{job.description}</div>
<hr className="hr" />
<div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
<button className="btn btnGhost" onClick={() => nav(`/client/jobs/${jobId}/edit`)}>Edit Job</button>
<Link className="btn" to="/client/jobs">Back</Link>
</div>
</div>

      )}
 
      <div className="card">
<div className="h2">Proposals</div>
<table className="table">
<thead>
<tr><th>Freelancer</th><th>Price</th><th>Status</th><th>Message</th><th style={{ width: 340 }}>Actions</th></tr>
</thead>
<tbody>

            {proposals.map((p) => {

              const id = p._id || p.proposalId;

              return (
<tr key={id}>
<td>{p.freelancerName || p.freelancerId}</td>
<td>{p.price}</td>
<td><span className="badge">{p.status || "submitted"}</span></td>
<td style={{ maxWidth: 380, whiteSpace: "pre-wrap" }}>{p.message}</td>
<td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
<button className="btn btnGhost" disabled={busyId===id} onClick={() => setProposalStatus(id, "shortlist")}>Shortlist</button>
<button className="btn" disabled={busyId===id} onClick={() => setProposalStatus(id, "accept")}>Accept</button>
<button className="btn btnDanger" disabled={busyId===id} onClick={() => setProposalStatus(id, "reject")}>Reject</button>
<button className="btn btnOk" disabled={busyId===id || (p.status !== "accept")} onClick={() => hire(p)}>

                      Hire → Contract
</button>
</td>
</tr>

              );

            })}

            {proposals.length === 0 && <tr><td colSpan="5" className="muted">No proposals yet.</td></tr>}
</tbody>
</table>
</div>
</div>

  );

}
 