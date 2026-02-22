import ClientPageScaffold from "./ClientPageScaffold";

export default function ClientJobDetail() {
  return (
    <ClientPageScaffold
      title="Job Details"
      description="Review full job information, applicants, and current progress for this project."
      actions={[
        { to: "/client/jobs", label: "Back to My Jobs" },
        { to: "/client/proposals", label: "Open Proposals" },
      ]}
    />
  );
}
