import React, { useEffect, useState } from "react";

const ClientProposals = () => {
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    setProposals([
      { id: 1, freelancer: "John", job: "Website Development" },
      { id: 2, freelancer: "Anna", job: "Mobile App Design" }
    ]);
  }, []);

  return (
    <div>
      <h2>Proposals</h2>
      <ul>
        {proposals.map(p => (
          <li key={p.id}>
            {p.freelancer} applied for {p.job}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClientProposals;