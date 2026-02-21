import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import ErrorBox from "../../components/ErrorBox";
import ConfirmButton from "../../components/ConfirmButton";
import { adminService } from "../../services/adminService";
import { reviewService } from "../../services/reviewService";

export default function AdminReviews() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    const load = async () => {
        setLoading(true); setErr(null);
        try {
            const data = await adminService.reviews.list();
            setItems(data?.items || data || []);
        } catch (e) { setErr(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    if (loading) return <Loading />;

    return (
        <div className="row">
            <div className="card"><div className="h1">Reviews Moderation</div><div className="muted">Remove fake/abusive reviews.</div></div>
            <ErrorBox error={err} />
            <div className="card">
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