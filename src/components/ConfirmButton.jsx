
import { useState } from "react";

export default function ConfirmButton({
  children,
  onConfirm,
  confirmMessage = "Are you sure?",
  className = "",
  disabled = false,
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading || disabled) return;

    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    try {
      setLoading(true);
      await onConfirm();
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading || disabled}
      className={`px-4 py-2 rounded text-white transition ${loading || disabled
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-red-600 hover:bg-red-700"
        } ${className}`}
    >
      {loading ? "Processing..." : children}
    </button>
  );
}