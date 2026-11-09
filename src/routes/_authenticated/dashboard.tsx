import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, PiggyBank, Plus, ReceiptText, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard, EmptyState } from "@/components/app/page-header";
import { CashFlowChart, CategoryDonut } from "@/components/app/charts";
import { TransactionList } from "@/components/app/transaction-list";
import { useTxDialog } from "@/components/app/transaction-dialog";
import { BudgetBar, StatusPill } from "@/components/app/budget-bar";
import { CategoryIcon } from "@/components/app/category-icon";
import {
  budgetProgress,
  inMonth,
  monthlySeries,
  shiftMonth,
  summarize,
  totalsByCategory,
} from "@/lib/finance";
import { useI18n } from "@/lib/i18n";
import {
  currentMonthKey,
  useBudgets,
  useDisplayName,
  useMoney,
  useTransactions,
} from "@/hooks/use-wallet";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Student Wallet" },
      { name: "description", content: "Your balance, income, expenses and budgets at a glance." },
      { property: "og:title", content: "Dashboard · Student Wallet" },
      { property: "og:description", content: "Your balance, income, expenses and budgets at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { t, cat } = useI18n();
  const name = useDisplayName();
  const money = useMoney();
  const txs = useTransactions();
  const budgets = useBudgets();
  const { open } = useTxDialog();

  const month = currentMonthKey();
  const all = summarize(txs);
  const monthTx = inMonth(txs, month);
  const cur = summarize(monthTx);
  const prev = summarize(inMonth(txs, shiftMonth(month, -1)));
  const savingsRate = cur.income > 0 ? Math.round(((cur.income - cur.expense) / cur.income) * 100) : 0;
  const series = monthlySeries(txs, 6, month);
  const byCat = totalsByCategory(monthTx, "expense");

  const delta = (now: number, before: number) => {
    if (before === 0) return null;
    const d = Math.round(((now - before) / before) * 100);
    return `${d > 0 ? "+" : ""}${d}% ${t("vs_last_month")}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{t("hello", { name })} 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("greeting_sub")}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="bg-balance dot-grid-wrap relative overflow-hidden rounded-3xl p-6 text-on-dark shadow-lift lg:col-span-1">
          <div className="dot-grid absolute inset-0 opacity-60" aria-hidden />
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-on-dark-muted">{t("total_balance")}</p>
              <Wallet className="size-5 text-accent" />
            </div>
            <p className="tabular mt-3 font-display text-4xl font-bold tracking-tight">{money(all.balance)}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-on-dark/10 p-3">
                <p className="flex items-center gap-1 text-xs text-on-dark-muted">
                  <ArrowDownLeft className="size-3.5" /> {t("total_income")}
                </p>
                <p className="tabular mt-1 text-sm font-bold">{money(all.income)}</p>
              </div>
              <div className="rounded-2xl bg-on-dark/10 p-3">
                <p className="flex items-center gap-1 text-xs text-on-dark-muted">
                  <ArrowUpRight className="size-3.5" /> {t("total_expenses")}
                </p>
                <p className="tabular mt-1 text-sm font-bold">{money(all.expense)}</p>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="accent" size="sm" onClick={() => open({ type: "income" })}>
                <Plus /> {t("add_income")}
              </Button>
              <Button variant="onDark" size="sm" onClick={() => open({ type: "expense" })}>
                <Plus /> {t("add_expense")}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2 lg:grid-cols-3">
          <StatCard
            label={t("month_income")}
            value={money(cur.income)}
            icon={<ArrowDownLeft className="size-4" />}
            tone="income"
            hint={delta(cur.income, prev.income)}
          />
          <StatCard
            label={t("month_expenses")}
            value={money(cur.expense)}
            icon={<ArrowUpRight className="size-4" />}
            tone="expense"
            hint={delta(cur.expense, prev.expense)}
          />
          <StatCard
            label={t("savings_rate")}
            value={`${savingsRate}%`}
            icon={<PiggyBank className="size-4" />}
            tone="primary"
            hint={t("this_month")}
          />
          <div className="surface p-5 sm:col-span-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("cash_flow")}</h2>
              <span className="text-xs text-muted-foreground">{t("last_6_months")}</span>
            </div>
            <CashFlowChart data={series} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface p-5 lg:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-lg font-bold">{t("recent_transactions")}</h2>
            <Link to="/transactions" className="flex items-center gap-1 text-sm font-semibold text-primary">
              {t("view_all")} <ArrowRight className="size-4" />
            </Link>
          </div>
          {txs.length === 0 ? (
            <EmptyState
              icon={<ReceiptText className="size-6" />}
              title={t("no_transactions")}
              subtitle={t("no_transactions_sub")}
              action={
                <Button onClick={() => open()}>
                  <Plus /> {t("add_transaction")}
                </Button>
              }
            />
          ) : (
            <TransactionList items={txs.slice(0, 6)} compact />
          )}
        </div>

        <div className="space-y-4">
          <div className="surface p-5">
            <h2 className="mb-4 text-lg font-bold">{t("spending_by_category")}</h2>
            {byCat.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("no_data")}</p>
            ) : (
              <CategoryDonut data={byCat} />
            )}
          </div>

          <div className="surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("budget_overview")}</h2>
              <Link to="/budget" className="text-sm font-semibold text-primary">
                {t("view_all")}
              </Link>
            </div>
            {budgets.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("no_budgets")}</p>
            ) : (
              <ul className="space-y-4">
                {budgets.slice(0, 4).map((b) => {
                  const spent = monthTx
                    .filter((x) => x.type === "expense" && x.category === b.category)
                    .reduce((s, x) => s + x.amount, 0);
                  const p = budgetProgress(b.monthly_limit, spent);
                  return (
                    <li key={b.id}>
                      <div className="mb-1.5 flex items-center gap-2">
                        <CategoryIcon category={b.category} className="size-7 rounded-lg [&_svg]:size-3.5" />
                        <span className="flex-1 truncate text-sm font-semibold">{cat(b.category)}</span>
                        <StatusPill status={p.status} label={`${p.percent}%`} />
                      </div>
                      <BudgetBar percent={p.percent} status={p.status} />
                      <p className="tabular mt-1 text-xs text-muted-foreground">
                        {money(spent)} / {money(b.monthly_limit)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
