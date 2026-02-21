import React, { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import Loading from "../../components/Loading";

import ErrorBox from "../../components/ErrorBox";

import ConfirmButton from "../../components/ConfirmButton";

import { jobService } from "../../services/jobService";
 
export default function ClientJobs() {

  const nav = useNavigate();

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);

  const [err, setErr] = useState(null);
 
  const load = async () => {

    setLoading(true); setErr(null);

    try {

      const data = await jobService.list("mine=1");

      setItems(data?.items || data || []);

    } catch (e) {

      setErr(e);

    } finally {

      setLoading(false);

    }

  };
 
  useEffect(() => { load(); }, []);
 
  const remove = async (id) => {

    await jobService.remove(id);

    await load();

  };
 
  if (loading) return <Loading />;
 
  return (
<div className="row">
<div className="card" style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
<div>
<div className="h1">My Jobs</div>
<div className="muted">Create and manage your job posts.</div>
</div>
<button className="btn" onClick={() => nav("/client/jobs/new")}>+ New Job</button>
</div>
 
      <ErrorBox error={err} />
 
      <div className="card">
<table className="table">
<thead>
<tr><th>Title</th><th>Budget</th><th>Status</th><th style={{ width: 260 }}>Actions</th></tr>
</thead>
<tbody>

            {items.map((j) => {

              const id = j._id || j.jobId;

              return (
<tr key={id}>
<td><Link to={`/client/jobs/${id}`} style={{ textDecoration: "underline" }}>{j.title}</Link></td>
<td>{j.budget}</td>
<td><span className="badge">{j.status || "open"}</span></td>
<td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
<button className="btn btnGhost" onClick={() => nav(`/client/jobs/${id}/edit`)}>Edit</button>
<ConfirmButton onConfirm={() => remove(id)} confirmText="Delete this job?">Delete</ConfirmButton>
</td>
</tr>

              );

            })}

            {items.length === 0 && <tr><td colSpan="4" className="muted">No jobs yet.</td></tr>}
</tbody>
</table>
</div>
</div>

  );

}
 