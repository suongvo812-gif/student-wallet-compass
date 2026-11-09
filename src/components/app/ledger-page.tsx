import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Plus, ReceiptText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, StatCard, EmptyState } from "./page-header";
import { TransactionList } from "./transaction-list";
import { useTxDialog } from "./transaction-dialog";
import { CategoryIcon } from "./category-icon";
import { inMonth, summarize, totalsByCategory, type TxType } from "@/lib/finance";
import { useI18n } from "@/lib/i18n";
import { currentMonthKey, useMoney, useTransactions } from "@/hooks/use-wallet";

export function LedgerPage({ type }: { type: TxType }) {
  const { t, cat } = useI18n();
  const money = useMoney();
  const { open } = useTxDialog();
  const all = useTransactions();
  const [q, setQ] = useState("");

  const items = useMemo(() => all.filter((x) => x.type === type), [all, type]);
  const month = currentMonthKey();
  const total = summarize(items)[type];
  const monthTotal = summarize(inMonth(items, month))[type];
  const top = totalsByCategory(items, type);
  const filtered = q
    ? items.filter((x) =>
        (x.description + " " + cat(x.category)).toLowerCase().includes(q.trim().toLowerCase()),
      )
    : items;

  const isIncome = type === "income";

  return (
    <div>
      <PageHeader
        title={isIncome ? t("nav_income") : t("nav_expenses")}
        subtitle={isIncome ? t("income_sub") : t("expenses_sub")}
        actions={
          <Button onClick={() => open({ type })}>
            <Plus /> {isIncome ? t("add_income") : t("add_expense")}
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label={isIncome ? t("total_income") : t("total_expenses")}
          value={money(total)}
          icon={isIncome ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
          tone={isIncome ? "income" : "expense"}
          hint={t("all_time")}
        />
        <StatCard
          label={isIncome ? t("month_income") : t("month_expenses")}
          value={money(monthTotal)}
          icon={<CalendarDays className="size-4" />}
          tone="primary"
          hint={t("this_month")}
        />
        <div className="surface p-5">
          <p className="text-sm font-medium text-muted-foreground">
            {isIncome ? t("top_sources") : t("top_categories")}
          </p>
          <ul className="mt-3 space-y-2">
            {top.slice(0, 3).map((x) => (
              <li key={x.category} className="flex items-center gap-2 text-sm">
                <CategoryIcon category={x.category} className="size-7 rounded-lg [&_svg]:size-3.5" />
                <span className="flex-1 truncate">{cat(x.category)}</span>
                <span className="tabular font-semibold">{money(x.amount)}</span>
              </li>
            ))}
            {top.length === 0 && <li className="text-sm text-muted-foreground">{t("no_data")}</li>}
          </ul>
        </div>
      </div>

      <div className="surface p-5">
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="pl-9" />
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<ReceiptText className="size-6" />}
            title={t("no_transactions")}
            subtitle={t("no_transactions_sub")}
          />
        ) : (
          <TransactionList items={filtered} />
        )}
      </div>
    </div>
  );
}
