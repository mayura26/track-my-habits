"use client";

import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Briefcase,
  Camera,
  Code,
  Coffee,
  Dumbbell,
  Globe,
  Heart,
  Home,
  Music,
  Star,
  Tag,
  User,
  Users,
  Zap,
} from "lucide-react";

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Heart,
  Dumbbell,
  User,
  BookOpen,
  Users,
  Star,
  Zap,
  Music,
  Code,
  Briefcase,
  Coffee,
  Home,
  Globe,
  Camera,
};

interface CategoryIconProps {
  icon: string;
  className?: string;
}

export function CategoryIcon({ icon, className }: CategoryIconProps) {
  const Icon = CATEGORY_ICON_MAP[icon] ?? Tag;
  return <Icon className={className} aria-hidden />;
}
