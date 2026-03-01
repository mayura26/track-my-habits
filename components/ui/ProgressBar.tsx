interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  className?: string;
  size?: "sm" | "md";
}

export function ProgressBar({ value, color = "#7c3aed", className = "", size = "md" }: ProgressBarProps) {
  const height = size === "sm" ? "h-1" : "h-2";
  return (
    <div className={`w-full overflow-hidden rounded-full bg-[#2a2a2a] ${height} ${className}`}>
      <div
        className={`${height} rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
      />
    </div>
  );
}
