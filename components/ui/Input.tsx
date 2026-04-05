import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-[#f7f0e1]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`rounded-2xl border border-[rgba(216,196,160,0.16)] bg-[rgba(14,21,19,0.86)] px-4 py-3 text-sm text-[#f7f0e1] placeholder-[#8d826d] shadow-[inset_0_1px_0_rgba(255,244,224,0.04)] focus:border-[rgba(230,196,139,0.52)] focus:outline-none ${error ? "border-red-500" : ""} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
