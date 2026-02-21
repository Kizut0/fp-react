import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ClientJobEditor = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    const newJob = { title, description };
    console.log("Job Submitted:", newJob);

    // Replace with API POST request
    navigate("/client/jobs");
  };

  return (
    <div>
      <h2>Create / Edit Job</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Job Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <br />
        <textarea
          placeholder="Job Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <br />
        <button type="submit">Save Job</button>
      </form>
    </div>
  );
};

export default ClientJobEditor;
