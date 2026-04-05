import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = "", id, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-[#f7f0e1]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={`min-h-12 rounded-2xl border border-[rgba(216,196,160,0.16)] bg-[rgba(14,21,19,0.86)] px-4 py-3 text-sm text-[#f7f0e1] shadow-[inset_0_1px_0_rgba(255,244,224,0.04)] transition-colors focus:border-[rgba(230,196,139,0.52)] focus:outline-none ${error ? "border-red-500" : ""} ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
