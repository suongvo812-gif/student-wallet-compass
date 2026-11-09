import type { BudgetStatus } from "@/lib/finance";
import { cn } from "@/lib/utils";

export function BudgetBar({ percent, status }: { percent: number; status: BudgetStatus }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500",
          status === "over" ? "bg-expense" : status === "warning" ? "bg-warning" : "bg-primary",
        )}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

export function StatusPill({ status, label }: { status: BudgetStatus; label: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-bold",
        status === "over"
          ? "bg-expense-soft text-expense"
          : status === "warning"
            ? "bg-warning-soft text-warning"
            : "bg-primary-soft text-primary",
      )}
    >
      {label}
    </span>
  );
}
