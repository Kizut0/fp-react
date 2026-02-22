import ClientPageScaffold from "./ClientPageScaffold";

export default function ClientReviews() {
  return (
    <ClientPageScaffold
      title="Client Reviews"
      description="Leave feedback for completed work to help maintain quality on the platform."
      actions={[
        { to: "/client/contracts", label: "Completed Contracts" },
        { to: "/client/dashboard", label: "Back to Dashboard" },
      ]}
    />
  );
}
