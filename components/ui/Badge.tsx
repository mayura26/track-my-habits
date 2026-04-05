import type { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info";
}

const variantClasses = {
  default: "bg-[rgba(247,240,225,0.08)] text-[#f7f0e1]",
  success: "bg-[rgba(83,108,88,0.28)] text-[#d5f0c9]",
  warning: "bg-[rgba(199,154,82,0.2)] text-[#f2d6a3]",
  error: "bg-red-900/40 text-red-300",
  info: "bg-[rgba(112,138,119,0.24)] text-[#cfe6d3]",
};

export function Badge({ variant = "default", className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-[rgba(255,244,224,0.08)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
