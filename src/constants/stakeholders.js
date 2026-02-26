const STAKEHOLDER_LIST = [
  {
    key: "freelancer",
    label: "Freelancer",
    icon: "🧑‍💻",
    description: "Freelancer account: browse jobs and submit proposals.",
  },
  {
    key: "client",
    label: "Client",
    icon: "🧾",
    description: "Client account: post jobs, review proposals, and hire.",
  },
  {
    key: "admin",
    label: "Admin",
    icon: "🛡️",
    description: "Admin account: manage users, jobs, and platform activity.",
  },
];

function normalizeStakeholderRole(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "freelance") return "freelancer";
  return raw;
}

function getStakeholderMeta(role) {
  const normalized = normalizeStakeholderRole(role);
  return (
    STAKEHOLDER_LIST.find((item) => item.key === normalized) || {
      key: normalized || "workspace",
      label: String(role || "Workspace"),
      icon: "👤",
      description: "",
    }
  );
}

export { STAKEHOLDER_LIST, normalizeStakeholderRole, getStakeholderMeta };
