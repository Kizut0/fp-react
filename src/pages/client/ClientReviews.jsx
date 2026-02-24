import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ErrorBox from "../../components/ErrorBox";
import Loading from "../../components/Loading";
import { contractService } from "../../services/contractService";
import { reviewService } from "../../services/reviewService";

function toArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function normalizeId(value) {
  return String(value || "").trim();
}

function normalizeStatus(value, fallback = "active") {
  const raw = String(value || fallback).trim().toLowerCase();
  return raw || fallback;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getContractKey(contract) {
  return normalizeId(contract?._id || contract?.contractId);
}

const DEFAULT_FORM = {
  contractId: "",
  revieweeId: "",
  rating: "5",
  comment: "",
};

export default function ClientReviews() {
  const [contracts, setContracts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [contractData, reviewData] = await Promise.all([
        contractService.list({ mine: "client" }),
        reviewService.list({ mine: "client" }),
      ]);

      setContracts(toArray(contractData));
      setReviews(toArray(reviewData));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const contractById = useMemo(() => {
    const out = new Map();
    contracts.forEach((contract) => {
      const id = getContractKey(contract);
      if (id) out.set(id, contract);
      if (normalizeId(contract?.contractId)) out.set(normalizeId(contract.contractId), contract);
    });
    return out;
  }, [contracts]);

  const completedContracts = useMemo(
    () => contracts.filter((contract) => normalizeStatus(contract?.status) === "completed"),
    [contracts]
  );

  const reviewedContractIds = useMemo(() => {
    const out = new Set();
    reviews.forEach((review) => {
      const id = normalizeId(review?.contractId);
      if (id) out.add(id);
    });
    return out;
  }, [reviews]);

  const availableContracts = useMemo(
    () => completedContracts.filter((contract) => !reviewedContractIds.has(getContractKey(contract))),
    [completedContracts, reviewedContractIds]
  );

  const selectedContract = useMemo(
    () => contractById.get(normalizeId(form.contractId)) || null,
    [contractById, form.contractId]
  );

  const stats = useMemo(() => {
    if (reviews.length === 0) return { avgRating: 0 };
    const total = reviews.reduce((sum, review) => sum + Number(review?.rating || 0), 0);
    return { avgRating: total / reviews.length };
  }, [reviews]);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onContractChange = (value) => {
    const contract = contractById.get(normalizeId(value));
    setForm((prev) => ({
      ...prev,
      contractId: value,
      revieweeId: contract?.freelancerId || "",
    }));
  };

  const createReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const contractId = normalizeId(form.contractId);
      const selected = contractById.get(contractId);
      const revieweeId = normalizeId(selected?.freelancerId || form.revieweeId);
      const rating = Number(form.rating);
      const comment = String(form.comment || "").trim();

      if (!contractId) throw new Error("Contract is required.");
      if (!revieweeId) throw new Error("Freelancer ID is required.");
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5.");
      }
      if (!comment) throw new Error("Please write a short review comment.");

      await reviewService.create({
        contractId,
        revieweeId,
        rating,
        comment,
      });

      setForm(DEFAULT_FORM);
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="row">
      <div className="card">
        <div className="h1">Client Reviews</div>
        <div className="muted">Leave a rating and feedback after contract completion.</div>
      </div>

      <ErrorBox message={error} />

      <div className="card">
        <div className="h2">Create Review</div>
        <div className="muted" style={{ marginBottom: 12 }}>
          Only completed contracts without a submitted review are shown.
        </div>

        <form className="row" onSubmit={createReview}>
          <div className="grid2">
            <div>
              <label className="block mb-1">Completed Contract</label>
              <select
                className="input"
                value={form.contractId}
                onChange={(e) => onContractChange(e.target.value)}
                required
              >
                <option value="">Select completed contract</option>
                {availableContracts.map((contract) => {
                  const id = getContractKey(contract);
                  if (!id) return null;

                  return (
                    <option key={id} value={id}>
                      {(contract.jobTitle || contract.jobId || "Untitled Project")} •
                      Freelancer {contract.freelancerName || contract.freelancerId || "-"}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block mb-1">Freelancer ID</label>
              <input
                className="input"
                value={form.revieweeId}
                onChange={(e) => updateForm("revieweeId", e.target.value)}
                placeholder="Auto-filled from contract"
                required
              />
            </div>

            <div>
              <label className="block mb-1">Rating</label>
              <select
                className="input"
                value={form.rating}
                onChange={(e) => updateForm("rating", e.target.value)}
              >
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Satisfactory</option>
                <option value="2">2 - Needs Improvement</option>
                <option value="1">1 - Poor</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-1">Comment</label>
            <textarea
              className="textarea"
              value={form.comment}
              onChange={(e) => updateForm("comment", e.target.value)}
              placeholder="Summarize communication, quality, and delivery."
              required
            />
          </div>

          <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
            <button type="submit" className="btn btnOk" disabled={submitting || availableContracts.length === 0}>
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
            <Link to="/client/contracts" className="btn">
              Completed Contracts
            </Link>
            <Link to="/client/dashboard" className="btn">
              Back to Dashboard
            </Link>
          </div>
        </form>

        {selectedContract && (
          <div className="muted" style={{ marginTop: 8 }}>
            Reviewing: {selectedContract.jobTitle || selectedContract.jobId || "Untitled Project"}
          </div>
        )}

        {availableContracts.length === 0 && (
          <div className="muted" style={{ marginTop: 8 }}>
            No reviewable completed contracts found.
          </div>
        )}
      </div>

      <div className="card">
        <div className="muted" style={{ marginBottom: 8 }}>
          Reviews submitted: {reviews.length} • Average rating: {stats.avgRating ? stats.avgRating.toFixed(1) : "0.0"}
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Contract</th>
              <th>Freelancer</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review, idx) => {
              const id = normalizeId(review?._id || review?.reviewId) || `${normalizeId(review?.contractId)}-${idx}`;
              const linkedContract = contractById.get(normalizeId(review?.contractId)) || null;

              return (
                <tr key={id}>
                  <td>{linkedContract?.jobTitle || review.contractId || "-"}</td>
                  <td>{review.revieweeName || review.revieweeId || linkedContract?.freelancerId || "-"}</td>
                  <td>
                    <span className="badge">{Number(review.rating || 0)}/5</span>
                  </td>
                  <td style={{ maxWidth: 360, whiteSpace: "pre-wrap" }}>{review.comment || "-"}</td>
                  <td className="muted">{formatDate(review.createdAt)}</td>
                </tr>
              );
            })}

            {reviews.length === 0 && (
              <tr>
                <td colSpan="5" className="muted">
                  No reviews submitted yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
