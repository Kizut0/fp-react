export default function FormField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
}) {
  return (
    <div className="mb-4">
      {label && <label className="block mb-1">{label}</label>}

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border px-3 py-2 rounded"
      />

      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
}