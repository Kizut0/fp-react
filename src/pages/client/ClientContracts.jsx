import React, { useEffect, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import Loading from "../../components/Loading";

import ErrorBox from "../../components/ErrorBox";

import { contractService } from "../../services/contractService";
 
export default function ClientContracts() {

  const loc = useLocation();

  const nav = useNavigate();

  const highlight = loc.state?.highlight;
 
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);

  const [err, setErr] = useState(null);

  const [busyId, setBusyId] = useState("");
 
  const load = async () => {

    setLoading(true); setErr(null);

    try {

      const data = await contractService.list("mine=client");

      setItems(data?.items || data || []);

    } catch (e) {

      setErr(e);

    } finally {

      setLoading(false);

    }

  };
 
  useEffect(() => { load(); }, []);
 
  const setStatus = async (id, status) => {

    setBusyId(id);

    try {

      await contractService.updateStatus(id, status);

      await load();

    } finally {

      setBusyId("");

    }

  };
 
  if (loading) return <Loading />;
 
  return (
<div className="row">
<div className="card">
<div className="h1">Contracts</div>
<div className="muted">Track active and completed work.</div>
</div>
<ErrorBox error={err} />
<div className="card">
<table className="table">
<thead>
<tr><th>Job</th><th>Freelancer</th><th>Status</th><th>Dates</th><th style={{ width: 300 }}>Actions</th></tr>
</thead>
<tbody>

            {items.map((c) => {

              const id = c._id || c.contractId;

              return (
<tr key={id} style={highlight === id ? { outline: "2px solid #3b65b3" } : undefined}>
<td>{c.jobTitle || c.jobId}</td>
<td>{c.freelancerName || c.freelancerId}</td>
<td><span className="badge">{c.status}</span></td>
<td className="muted">

                    {c.startDate ? new Date(c.startDate).toLocaleDateString() : "-"} → {c.endDate ? new Date(c.endDate).toLocaleDateString() : "-"}
</td>
<td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
<button className="btn btnOk" disabled={busyId===id} onClick={() => setStatus(id, "completed")}>Mark Completed</button>
<button className="btn btnDanger" disabled={busyId===id} onClick={() => setStatus(id, "cancelled")}>Cancel</button>
<button className="btn btnGhost" onClick={() => nav("/client/payments", { state: { contractId: id } })}>

                      Add Payment
</button>
<button className="btn btnGhost" onClick={() => nav("/client/reviews", { state: { contractId: id } })}>

                      Add Review
</button>
</td>
</tr>

              );

            })}

            {items.length === 0 && <tr><td colSpan="5" className="muted">No contracts.</td></tr>}
</tbody>
</table>
</div>
</div>

  );

}
 