import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { reviewService } from "../../services/reviewService";
import apiClient from "../../services/apiClient";

export default function FreelancerProfilePublic() {
    const { id } = useParams();
    const [freelancer, setFreelancer] = useState(null);
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userRes = await apiClient.get(`/users/${id}`);
                setFreelancer(userRes.data);

                const reviewData = await reviewService.getByUser(id);
                setReviews(reviewData);
            } catch (error) {
                console.error(error);
            }
        };

        fetchData();
    }, [id]);

    if (!freelancer) return <p className="p-6">Loading profile...</p>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="border p-6 rounded shadow mb-6">
                <h1 className="text-2xl font-bold">
                    {freelancer.name}
                </h1>
                <p className="text-gray-600">{freelancer.email}</p>
                <p className="mt-3">{freelancer.bio}</p>
            </div>

            <h2 className="text-xl font-semibold mb-4">
                Client Reviews
            </h2>

            <div className="space-y-4">
                {reviews.length === 0 && <p>No reviews yet.</p>}

                {reviews.map((review) => (
                    <div
                        key={review._id}
                        className="border p-4 rounded bg-gray-50"
                    >
                        <p className="font-semibold">
                            Rating: ⭐ {review.rating}/5
                        </p>
                        <p className="text-gray-700">
                            {review.comment}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}