import React from "react";
import { useParams } from "react-router-dom";

const ClientJobDetail = () => {
  const { id } = useParams();

  return (
    <div>
      <h2>Job Detail</h2>
      <p>Job ID: {id}</p>
      {/* Replace with API fetch by ID */}
    </div>
  );
};

export default ClientJobDetail;