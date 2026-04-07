import { CategoryIcon } from "./CategoryIcon";

interface CategoryBadgeProps {
  name: string;
  color: string;
  icon: string;
}

export function CategoryBadge({ name, color, icon }: CategoryBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}22`, color }}
    >
      <CategoryIcon icon={icon} className="h-3.5 w-3.5" />
      {name}
    </span>
  );
}
