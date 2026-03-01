import type { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info";
}

const variantClasses = {
  default: "bg-[#2a2a2a] text-[#f5f5f5]",
  success: "bg-green-900/40 text-green-400",
  warning: "bg-yellow-900/40 text-yellow-400",
  error: "bg-red-900/40 text-red-400",
  info: "bg-blue-900/40 text-blue-400",
};

export function Badge({ variant = "default", className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
