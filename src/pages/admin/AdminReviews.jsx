import React, { useEffect, useMemo, useState } from "react";
import Loading from "../../components/Loading";
import ErrorBox from "../../components/ErrorBox";
import ConfirmButton from "../../components/ConfirmButton";
import { adminService } from "../../services/adminService";
import { reviewService } from "../../services/reviewService";

function normalizeId(value) {
    if (value === undefined || value === null) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number") return String(value);
    if (typeof value === "object") {
        if (typeof value.$oid === "string") return value.$oid.trim();
        if (typeof value.id === "string") return value.id.trim();
        if (typeof value._id === "string") return value._id.trim();
    }
    return "";
}

export default function AdminReviews() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [query, setQuery] = useState("");
    const [ratingFilter, setRatingFilter] = useState("all");

    const load = async () => {
        setLoading(true); setErr(null);
        try {
            const data = await adminService.reviews.list();
            setItems(data?.items || data || []);
        } catch (e) { setErr(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const removeReview = async (id) => {
        if (!id) {
            setErr(new Error("Missing review id"));
            return;
        }

        try {
            setErr(null);
            await reviewService.remove(id);
            await load();
        } catch (error) {
            setErr(error);
            throw error;
        }
    };

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return items.filter((item) => {
            const rating = String(Number(item.rating || 0));
            if (ratingFilter !== "all" && rating !== ratingFilter) return false;
            if (!q) return true;

            const fields = [item.contractId, item.comment, item.revieweeId, item.reviewerId]
                .map((v) => String(v || "").toLowerCase())
                .join(" ");

            return fields.includes(q);
        });
    }, [items, query, ratingFilter]);

    if (loading) return <Loading />;

    return (
        <div className="row">
            <div className="card"><div className="h1">Reviews Moderation</div><div className="muted">Remove fake/abusive reviews.</div></div>
            <ErrorBox error={err} />
            <div className="card">
                <div className="flex justify-between items-center" style={{ gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                    <div className="muted">Total reviews: {items.length}</div>
                    <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
                        <input
                            className="input"
                            placeholder="Search reviews..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            style={{ minWidth: 220 }}
                        />
                        <select className="input" value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
                            <option value="all">All ratings</option>
                            <option value="5">5 stars</option>
                            <option value="4">4 stars</option>
                            <option value="3">3 stars</option>
                            <option value="2">2 stars</option>
                            <option value="1">1 star</option>
                        </select>
                    </div>
                </div>
                <table className="table">
                    <thead><tr><th>Contract</th><th>Reviewer</th><th>Reviews</th><th>Rating</th><th>Comment</th><th style={{ width: 140 }}>Actions</th></tr></thead>
                    <tbody>
                        {filtered.map((r) => {
                            const id = normalizeId(r._id) || normalizeId(r.reviewId);
                            return (
                                <tr key={id}>
                                    <td>{r.contractId}</td>
                                    <td>{r.reviewerName || r.reviewerId || "-"}</td>
                                    <td>{r.revieweeName || r.revieweeId || "-"}</td>
                                    <td><span className="badge">{r.rating}</span></td>
                                    <td style={{ whiteSpace: "pre-wrap" }}>{r.comment}</td>
                                    <td>
                                        <ConfirmButton disabled={!id} onConfirm={() => removeReview(id)}>Delete</ConfirmButton>
                                    </td>
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && <tr><td colSpan="6" className="muted">No reviews found for this filter.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
