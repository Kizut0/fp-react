import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Loading from "../../components/Loading";
import ErrorBox from "../../components/ErrorBox";
import FormField from "../../components/FormField";
import ConfirmButton from "../../components/ConfirmButton";
import { proposalService } from "../../services/proposalService";

export default function MyProposals() {
    const loc = useLocation();
    const prefillJob = loc.state?.createForJob;

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    const [jobId, setJobId] = useState(prefillJob?._id || prefillJob?.jobId || "");
    const [price, setPrice] = useState("");
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);

    const load = async () => {
        setLoading(true); setErr(null);
        try {
            const data = await proposalService.list("mine=freelancer");
            setItems(data?.items || data || []);
        } catch (e) {
            setErr(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const createProposal = async (e) => {
        e.preventDefault();
        setBusy(true); setErr(null);
        try {
            await proposalService.create({
                jobId,
                price: Number(price),
                message,
                status: "submitted",
            });
            setPrice("");
            setMessage("");
            await load();
        } catch (e2) {
            setErr(e2);
        } finally {
            setBusy(false);
        }
    };

    const canCreate = useMemo(() => Boolean(jobId && price && message), [jobId, price, message]);

    if (loading) return <Loading />;

    return (
        <div className="row">
            <div className="card">
                <div className="h1">My Proposals</div>
                <div className="muted">Submit, edit, or withdraw proposals before hiring.</div>
            </div>

            <ErrorBox error={err} />

            <div className="card">
                <div className="h2">Submit Proposal</div>
                {prefillJob && (
                    <div className="muted" style={{ marginBottom: 10 }}>
                        Prefilled Job: <b>{prefillJob.title}</b>
                    </div>
                )}
                <form className="row" onSubmit={createProposal}>
                    <FormField label="Job ID">
                        <input className="input" value={jobId} onChange={(e) => setJobId(e.target.value)} required />
                    </FormField>
                    <FormField label="Price">
                        <input className="input" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
                    </FormField>
                    <FormField label="Message">
                        <textarea className="textarea" value={message} onChange={(e) => setMessage(e.target.value)} required />
                    </FormField>
                    <button className="btn btnOk" disabled={busy || !canCreate}>{busy ? "Submitting..." : "Submit"}</button>
                </form>
            </div>

            <div className="card">
                <div className="h2">History</div>
                <table className="table">
                    <thead><tr><th>Job</th><th>Price</th><th>Status</th><th>Message</th><th style={{ width: 140 }}>Actions</th></tr></thead>
                    <tbody>
                        {items.map((p) => {
                            const id = p._id || p.proposalId;
                            return (
                                <tr key={id}>
                                    <td>{p.jobTitle || p.jobId}</td>
                                    <td>{p.price}</td>
                                    <td><span className="badge">{p.status}</span></td>
                                    <td style={{ whiteSpace: "pre-wrap" }}>{p.message}</td>
                                    <td>
                                        <ConfirmButton
                                            confirmText="Withdraw this proposal?"
                                            onConfirm={() => proposalService.remove(id).then(load)}
                                        >
                                            Withdraw
                                        </ConfirmButton>
                                    </td>
                                </tr>
                            );
                        })}
                        {items.length === 0 && <tr><td colSpan="5" className="muted">No proposals.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}