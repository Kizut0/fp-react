export default function ConfirmButton({
  onConfirm,
  children,
  confirmMessage = "Are you sure?",
  className = "",
}) {
  const handleClick = () => {
    if (window.confirm(confirmMessage)) {
      onConfirm();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`bg-red-600 text-white px-3 py-1 rounded ${className}`}
    >
      {children}
    </button>
  );
}