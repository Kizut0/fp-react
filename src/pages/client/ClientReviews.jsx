import React, { useEffect, useState } from "react";

const ClientReviews = () => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    setReviews([
      { id: 1, freelancer: "John", rating: 5, comment: "Great work!" },
      { id: 2, freelancer: "Anna", rating: 4, comment: "Very professional." }
    ]);
  }, []);

  return (
    <div>
      <h2>Reviews</h2>
      <ul>
        {reviews.map(review => (
          <li key={review.id}>
            {review.freelancer} - ⭐ {review.rating}
            <p>{review.comment}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClientReviews;