import ClientPageScaffold from "./ClientPageScaffold";

export default function ClientContracts() {
  return (
    <ClientPageScaffold
      title="Client Contracts"
      description="Keep project agreements organized and monitor contract milestones."
      actions={[
        { to: "/client/payments", label: "Review Payments" },
        { to: "/client/jobs", label: "View Jobs" },
      ]}
    />
  );
}
