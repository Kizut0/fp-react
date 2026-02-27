const PAYMENT_STATUS_ALIASES = {
  hold: "reserved",
  pending: "in_review",
  paid: "released",
  completed: "released",
};

const KNOWN_PAYMENT_STATUSES = new Set([
  "reserved",
  "in_review",
  "released",
  "withdrawn",
  "failed",
  "refunded",
  "disputed",
]);

export function normalizePaymentStatus(value, fallback = "unknown") {
  const raw = String(value || "").trim().toLowerCase();
  const mapped = PAYMENT_STATUS_ALIASES[raw] || raw;
  if (KNOWN_PAYMENT_STATUSES.has(mapped)) return mapped;

  const fallbackRaw = String(fallback || "").trim().toLowerCase();
  const fallbackMapped = PAYMENT_STATUS_ALIASES[fallbackRaw] || fallbackRaw;
  if (KNOWN_PAYMENT_STATUSES.has(fallbackMapped)) return fallbackMapped;

  return fallbackRaw || "unknown";
}

export function isSettledPaymentStatus(value) {
  const normalized = normalizePaymentStatus(value, "");
  return normalized === "released" || normalized === "withdrawn";
}
