import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export type ButtonVariant = NonNullable<ButtonProps["variant"]>;
export type ButtonSize = NonNullable<ButtonProps["size"]>;

const variantClasses = {
  primary:
    "border border-[rgba(230,196,139,0.5)] bg-[linear-gradient(135deg,#c79a52,#8c6737)] text-[#fff9ef] shadow-[0_18px_40px_rgba(130,95,45,0.35)] hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.97] disabled:opacity-50",
  secondary:
    "surface-panel text-[#f7f0e1] hover:border-[rgba(230,196,139,0.34)] hover:bg-[rgba(34,44,39,0.95)] active:scale-[0.97]",
  ghost:
    "text-[#b4a58a] hover:bg-[rgba(247,240,225,0.05)] hover:text-[#f7f0e1] active:scale-[0.97]",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:scale-[0.97] disabled:opacity-50",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

const baseButtonClasses =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium focus:outline-none focus:ring-2 focus:ring-[rgba(230,196,139,0.5)] focus:ring-offset-2 focus:ring-offset-[#111814] disabled:cursor-not-allowed motion-reduce:active:scale-100";

export function buttonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className = "",
) {
  return `${baseButtonClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
}

const linkVariantClasses = {
  subtle:
    "border border-[rgba(216,196,160,0.22)] bg-[rgba(247,240,225,0.04)] text-[#f3ddb0] hover:border-[rgba(230,196,139,0.4)] hover:bg-[rgba(247,240,225,0.08)] active:scale-[0.98]",
};

export function linkButtonClassName(
  variant: keyof typeof linkVariantClasses = "subtle",
  size: ButtonSize = "sm",
  className = "",
) {
  return `${baseButtonClasses} ${linkVariantClasses[variant]} ${sizeClasses[size]} ${className}`;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", className = "", children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={buttonClassName(variant, size, className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
