import React, { useEffect, useMemo, useState } from "react";
import Loading from "../../components/Loading";
import ErrorBox from "../../components/ErrorBox";
import { reviewService } from "../../services/reviewService";

export default function FreelancerReviews() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [ratingFilter, setRatingFilter] = useState("all");
    const [query, setQuery] = useState("");

    useEffect(() => {
        const run = async () => {
            setLoading(true); setErr(null);
            try {
                const data = await reviewService.list("mine=freelancer");
                setItems(data?.items || data || []);
            } catch (e) {
                setErr(e);
            } finally {
                setLoading(false);
            }
        };
        run();
    }, []);

    const avgRating = useMemo(() => {
        if (!items.length) return 0;
        const total = items.reduce((sum, item) => sum + Number(item.rating || 0), 0);
        return total / items.length;
    }, [items]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return items.filter((item) => {
            if (ratingFilter !== "all" && String(Number(item.rating || 0)) !== ratingFilter) return false;
            if (!q) return true;

            const fields = [item.contractId, item.comment, item.rating]
                .map((v) => String(v || "").toLowerCase())
                .join(" ");

            return fields.includes(q);
        });
    }, [items, query, ratingFilter]);

    if (loading) return <Loading />;

    return (
        <div className="row">
            <div className="card">
                <div className="h1">Reviews</div>
                <div className="muted">Your performance feedback.</div>
            </div>
            <ErrorBox error={err} />
            <div className="card">
                <div className="flex justify-between items-center" style={{ gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                    <div className="muted">
                        Total: {items.length} • Average rating: {avgRating ? avgRating.toFixed(1) : "0.0"}
                    </div>
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
                    <thead><tr><th>Contract</th><th>Rating</th><th>Comment</th></tr></thead>
                    <tbody>
                        {filtered.map((r) => (
                            <tr key={r._id || r.reviewId}>
                                <td>{r.contractId}</td>
                                <td><span className="badge">{r.rating}</span></td>
                                <td style={{ whiteSpace: "pre-wrap" }}>{r.comment}</td>
                            </tr>
                        ))}
                        {filtered.length === 0 && <tr><td colSpan="3" className="muted">No reviews found for this filter.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
