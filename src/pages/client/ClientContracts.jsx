import React, { useEffect, useState } from "react";

const ClientContracts = () => {
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    setContracts([
      { id: 1, freelancer: "John", status: "Active" },
      { id: 2, freelancer: "Anna", status: "Completed" }
    ]);
  }, []);

  return (
    <div>
      <h2>Contracts</h2>
      <ul>
        {contracts.map(contract => (
          <li key={contract.id}>
            {contract.freelancer} - {contract.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClientContracts;