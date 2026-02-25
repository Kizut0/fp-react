
export default function StatCard({
  title,
  label,
  value,
  icon,
  trend,
  trendValue,
  className = "",
}) {
  const heading = title || label || "";
  const trendColor =
    trend === "up"
      ? "text-green-600"
      : trend === "down"
        ? "text-red-600"
        : "text-gray-500";

  const trendSymbol =
    trend === "up" ? "▲" : trend === "down" ? "▼" : "";

  return (
    <div className={`card statCard ${className}`}>
      <div className="statCardBody">
        <h4 className="statCardLabel">{heading}</h4>
        <p className="statCardValue">{value}</p>

        {trend && (
          <p className={`statCardTrend ${trendColor}`}>
            {trendSymbol} {trendValue}
          </p>
        )}
      </div>

      {icon && (
        <div className="statCardIcon">
          {icon}
        </div>
      )}
    </div>
  );
}
