import ClientPageScaffold from "./ClientPageScaffold";

export default function ClientDashboard() {
  return (
    <ClientPageScaffold
      title="Client Dashboard"
      description="Track your job posts, proposals, contracts, and payments in one place."
      actions={[
        { to: "/client/jobs/new", label: "Post a New Job" },
        { to: "/client/proposals", label: "Review Proposals" },
      ]}
    />
  );
}
