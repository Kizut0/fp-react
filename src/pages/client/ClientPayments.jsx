import React, { useEffect, useState } from "react";

const ClientPayments = () => {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    setPayments([
      { id: 1, amount: 500, status: "Paid" },
      { id: 2, amount: 300, status: "Pending" }
    ]);
  }, []);

  return (
    <div>
      <h2>Payments</h2>
      <ul>
        {payments.map(payment => (
          <li key={payment.id}>
            ${payment.amount} - {payment.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClientPayments;