interface ProgressBarProps {
  value: number;
  color?: string;
  className?: string;
  size?: "sm" | "md";
}

export function ProgressBar({
  value,
  color = "linear-gradient(90deg, #f3ddb0 0%, #c79a52 45%, #7d9c73 100%)",
  className = "",
  size = "md",
}: ProgressBarProps) {
  const height = size === "sm" ? "h-1" : "h-2";

  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-[rgba(247,240,225,0.08)] ${height} ${className}`}
    >
      <div
        className={`${height} rounded-full transition-all duration-500`}
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: color,
          boxShadow: "0 0 24px rgba(199, 154, 82, 0.24)",
        }}
      />
    </div>
  );
}
