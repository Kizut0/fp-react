import React, { useEffect, useState } from "react";

import ErrorBox from "../../components/ErrorBox";

import Loading from "../../components/Loading";

import StatCard from "../../components/StatCard";

import { dashboardService } from "../../services/dashboardService";
 
export default function ClientDashboard() {

  const [data, setData] = useState(null);

  const [err, setErr] = useState(null);

  const [loading, setLoading] = useState(true);
 
  useEffect(() => {

    const run = async () => {

      setLoading(true); setErr(null);

      try {

        setData(await dashboardService.client());

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
<div className="h1">Client Dashboard</div>
<div className="muted">Your hiring activity overview.</div>
</div>
 
      <ErrorBox error={err} />
<div className="grid3">
<StatCard label="Jobs Posted" value={data?.jobsPosted} />
<StatCard label="Proposals Received" value={data?.proposalsReceived} />
<StatCard label="Active Contracts" value={data?.activeContracts} />
</div>
 
      <div className="grid2">
<StatCard label="Hiring Success Rate" value={data?.hiringSuccessRate ? `${data.hiringSuccessRate}%` : "-"} hint="Accepted / total proposals" />
<StatCard label="Popular Categories" value={(data?.popularCategories || []).join(", ") || "-"} />
</div>
</div>

  );

}
 