import ClientPageScaffold from "./ClientPageScaffold";

export default function ClientPayments() {
  return (
    <ClientPageScaffold
      title="Client Payments"
      description="Track paid, pending, and upcoming invoices for your active work."
      actions={[
        { to: "/client/contracts", label: "Open Contracts" },
        { to: "/client/reviews", label: "Leave Reviews" },
      ]}
    />
  );
}
