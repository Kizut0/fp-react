function extractMessage(value) {
  if (!value) return "";
  if (typeof value === "string") return value;

  const responseMessage = value?.response?.data?.message;
  if (responseMessage) return String(responseMessage);

  const errorMessage = value?.message;
  if (errorMessage) return String(errorMessage);

  return String(value);
}

export default function ErrorBox({ message, error }) {
  const text = extractMessage(message || error);
  if (!text) return null;

  return <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{text}</div>;
}
