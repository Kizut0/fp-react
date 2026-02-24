

export default function StatCard({
  title,
  value,
  icon,
  trend,
  trendValue,
  className = "",
}) {
  const trendColor =
    trend === "up"
      ? "text-green-600"
      : trend === "down"
        ? "text-red-600"
        : "text-gray-500";

  const trendSymbol =
    trend === "up" ? "▲" : trend === "down" ? "▼" : "";

  return (
    <div
      className={`bg-white shadow-md rounded-xl p-5 flex justify-between items-center ${className}`}
    >
      <div>
        <h4 className="text-sm text-gray-500">{title}</h4>
        <p className="text-2xl font-bold mt-1">{value}</p>

        {trend && (
          <p className={`text-sm mt-2 ${trendColor}`}>
            {trendSymbol} {trendValue}
          </p>
        )}
      </div>

      {icon && (
        <div className="text-3xl text-gray-400">
          {icon}
        </div>
      )}
    </div>
  );
}