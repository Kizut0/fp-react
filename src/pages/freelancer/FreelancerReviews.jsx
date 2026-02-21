import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import ErrorBox from "../../components/ErrorBox";
import { reviewService } from "../../services/reviewService";

export default function FreelancerReviews() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

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

    if (loading) return <Loading />;

    return (
        <div className="row">
            <div className="card">
                <div className="h1">Reviews</div>
                <div className="muted">Your performance feedback.</div>
            </div>
            <ErrorBox error={err} />
            <div className="card">
                <table className="table">
                    <thead><tr><th>Contract</th><th>Rating</th><th>Comment</th></tr></thead>
                    <tbody>
                        {items.map((r) => (
                            <tr key={r._id || r.reviewId}>
                                <td>{r.contractId}</td>
                                <td><span className="badge">{r.rating}</span></td>
                                <td style={{ whiteSpace: "pre-wrap" }}>{r.comment}</td>
                            </tr>
                        ))}
                        {items.length === 0 && <tr><td colSpan="3" className="muted">No reviews.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}