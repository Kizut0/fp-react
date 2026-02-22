import ClientPageScaffold from "./ClientPageScaffold";

export default function ClientProposals() {
  return (
    <ClientPageScaffold
      title="Client Proposals"
      description="Compare freelancer bids, review profiles, and move forward with the best match."
      actions={[
        { to: "/client/contracts", label: "Manage Contracts" },
        { to: "/jobs", label: "Browse Jobs" },
      ]}
    />
  );
}
