import type { ButtonHTMLAttributes } from "react";

type ChoiceCardProps = {
  title: string;
  body: string;
  active: boolean;
  onClick: () => void;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick">;

export function ChoiceCard({
  title,
  body,
  active,
  onClick,
  className = "",
  ...rest
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "w-full rounded-[22px] border p-4 text-left select-none touch-manipulation",
        "transition-[transform,background-color,border-color,box-shadow] duration-150 ease-out",
        "active:scale-[0.985] active:shadow-[inset_0_2px_14px_rgba(0,0,0,0.28)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(230,196,139,0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1211]",
        "motion-reduce:transition-colors motion-reduce:active:scale-100 motion-reduce:active:shadow-none",
        active
          ? "border-[rgba(230,196,139,0.42)] bg-[rgba(199,154,82,0.16)] active:bg-[rgba(199,154,82,0.22)]"
          : "border-[rgba(216,196,160,0.14)] bg-[rgba(12,17,16,0.45)] active:bg-[rgba(247,240,225,0.07)]",
        className,
      ].join(" ")}
      {...rest}
    >
      <p className="font-semibold text-[#f7f0e1]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#b4a58a]">{body}</p>
    </button>
  );
}
