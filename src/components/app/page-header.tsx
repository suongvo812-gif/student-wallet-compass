import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
        {icon}
      </div>
      <p className="font-display text-lg font-semibold">{title}</p>
      {subtitle && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone = "primary",
  hint,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone?: "primary" | "income" | "expense" | "warning";
  hint?: ReactNode;
}) {
  const toneClass = {
    primary: "bg-primary-soft text-primary",
    income: "bg-income-soft text-income",
    expense: "bg-expense-soft text-expense",
    warning: "bg-warning-soft text-warning",
  }[tone];
  return (
    <div className="surface animate-rise p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={`grid size-9 place-items-center rounded-xl ${toneClass}`}>{icon}</span>
      </div>
      <p className="tabular mt-3 font-display text-2xl font-bold tracking-tight">{value}</p>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
