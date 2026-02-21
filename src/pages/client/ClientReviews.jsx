import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Loading from "../../components/Loading";
import ErrorBox from "../../components/ErrorBox";
import FormField from "../../components/FormField";
import ConfirmButton from "../../components/ConfirmButton";
import { reviewService } from "../../services/reviewService";

export default function ClientReviews() {
  const loc = useLocation();
  const presetContractId = loc.state?.contractId || "";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [contractId, setContractId] = useState(presetContractId);
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const data = await reviewService.list("mine=client");
      setItems(data?.items || data || []);
    } catch (e) {
      setErr(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createReview = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      await reviewService.create({
        contractId,
        rating: Number(rating),
        comment,
      });
      setComment("");
      await load();
    } catch (e2) {
      setErr(e2);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="row">
      <div className="card">
        <div className="h1">Reviews</div>
        <div className="muted">Submit reviews after contract completion.</div>
      </div>

      <ErrorBox error={err} />

      <div className="card">
        <div className="h2">Create Review</div>
        <form className="row" onSubmit={createReview}>
          <FormField label="Contract ID">
            <input className="input" value={contractId} onChange={(e) => setContractId(e.target.value)} required />
          </FormField>
          <FormField label="Rating (1-5)">
            <select className="select" value={rating} onChange={(e) => setRating(e.target.value)}>
              <option value="5">5</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option>
            </select>
          </FormField>
          <FormField label="Comment">
            <textarea className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} required />
          </FormField>
          <button className="btn btnOk" disabled={busy}>{busy ? "Posting..." : "Post Review"}</button>
        </form>
      </div>

      <div className="card">
        <div className="h2">My Reviews</div>
        <table className="table">
          <thead><tr><th>Contract</th><th>Rating</th><th>Comment</th><th style={{ width: 140 }}>Actions</th></tr></thead>
          <tbody>
            {items.map((r) => {
              const id = r._id || r.reviewId;
              return (
                <tr key={id}>
                  <td>{r.contractId}</td>
                  <td><span className="badge">{r.rating}</span></td>
                  <td style={{ whiteSpace: "pre-wrap" }}>{r.comment}</td>
                  <td>
                    <ConfirmButton onConfirm={() => reviewService.remove(id).then(load)}>Delete</ConfirmButton>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && <tr><td colSpan="4" className="muted">No reviews.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}