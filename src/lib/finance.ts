export type TxType = "income" | "expense";

export interface Tx {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  description: string;
  occurred_on: string; // YYYY-MM-DD
  card_id: string | null;
  created_at: string;
}

export const INCOME_CATEGORIES = [
  "allowance",
  "part_time",
  "scholarship",
  "gift",
  "other_income",
] as const;

export const EXPENSE_CATEGORIES = [
  "food",
  "transport",
  "housing",
  "education",
  "entertainment",
  "shopping",
  "health",
  "bills",
  "other",
] as const;

const ALL_CATEGORIES: string[] = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export function categoryColor(category: string): string {
  const idx = Math.max(0, ALL_CATEGORIES.indexOf(category));
  return `var(--cat-${(idx % 9) + 1})`;
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function monthKeyOf(date: string | Date): string {
  if (typeof date === "string") return date.slice(0, 7);
  return toDateKey(date).slice(0, 7);
}

export function shiftMonth(key: string, delta: number): string {
  const y = Number(key.slice(0, 4));
  const m = Number(key.slice(5, 7));
  const d = new Date(y, m - 1 + delta, 1);
  return monthKeyOf(d);
}

export function summarize(txs: Pick<Tx, "type" | "amount">[]) {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.type === "income") income += Number(t.amount);
    else expense += Number(t.amount);
  }
  return { income, expense, balance: income - expense };
}

export function inMonth<T extends Pick<Tx, "occurred_on">>(txs: T[], key: string): T[] {
  return txs.filter((t) => t.occurred_on.startsWith(key));
}

export function monthlySeries(txs: Tx[], months: number, currentKey: string) {
  const out: { key: string; income: number; expense: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const key = shiftMonth(currentKey, -i);
    const s = summarize(inMonth(txs, key));
    out.push({ key, income: s.income, expense: s.expense });
  }
  return out;
}

export function totalsByCategory(txs: Tx[], type: TxType) {
  const map = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== type) continue;
    map.set(t.category, (map.get(t.category) ?? 0) + Number(t.amount));
  }
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export type BudgetStatus = "ok" | "warning" | "over";

/** Budget progress: warning from 80% spent, over once spending exceeds 100%. */
export function budgetProgress(limit: number, spent: number) {
  const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  const status: BudgetStatus = percent > 100 ? "over" : percent >= 80 ? "warning" : "ok";
  return { percent, status, remaining: limit - spent };
}

export function formatMoney(amount: number, currency: string, lang: "vi" | "en") {
  const locale = lang === "vi" ? "vi-VN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
  }).format(amount);
}

export function formatCompact(amount: number, lang: "vi" | "en") {
  return new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}
