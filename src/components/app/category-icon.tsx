import {
  BookOpen,
  Briefcase,
  Bus,
  CircleDollarSign,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Receipt,
  ShoppingBag,
  Utensils,
  Wallet,
  Shapes,
  type LucideIcon,
} from "lucide-react";
import { categoryColor } from "@/lib/finance";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  allowance: Wallet,
  part_time: Briefcase,
  scholarship: GraduationCap,
  gift: Gift,
  other_income: CircleDollarSign,
  food: Utensils,
  transport: Bus,
  housing: Home,
  education: BookOpen,
  entertainment: Gamepad2,
  shopping: ShoppingBag,
  health: HeartPulse,
  bills: Receipt,
  other: Shapes,
};

export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const Icon = ICONS[category] ?? Shapes;
  const color = categoryColor(category);
  return (
    <span
      className={cn("grid size-10 shrink-0 place-items-center rounded-xl", className)}
      style={{ backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`, color }}
    >
      <Icon className="size-[18px]" />
    </span>
  );
}
