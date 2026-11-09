import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PiggyBank, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, EmptyState } from "@/components/app/page-header";
import { CategoryIcon } from "@/components/app/category-icon";
import { BudgetBar, StatusPill } from "@/components/app/budget-bar";
import { budgetProgress, EXPENSE_CATEGORIES, inMonth } from "@/lib/finance";
import { useI18n } from "@/lib/i18n";
import { useDeleteBudget, useSaveBudget, type Budget } from "@/lib/queries";
import { currentMonthKey, useBudgets, useMoney, useTransactions } from "@/hooks/use-wallet";

export const Route = createFileRoute("/_authenticated/budget")({
  head: () => ({
    meta: [
      { title: "Budget · Student Wallet" },
      { name: "description", content: "Set monthly spending limits per category and track progress." },
      { property: "og:title", content: "Budget · Student Wallet" },
      { property: "og:description", content: "Monthly spending limits with live progress." },
    ],
  }),
  component: BudgetPage,
});

function BudgetPage() {
  const { t, cat } = useI18n();
  const money = useMoney();
  const budgets = useBudgets();
  const txs = useTransactions();
  const del = useDeleteBudget();
  const [editing, setEditing] = useState<{ open: boolean; budget?: Budget }>({ open: false });

  const monthTx = inMonth(txs, currentMonthKey()).filter((x) => x.type === "expense");
  const spentFor = (c: string) => monthTx.filter((x) => x.category === c).reduce((s, x) => s + x.amount, 0);
  const totalLimit = budgets.reduce((s, b) => s + b.monthly_limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + spentFor(b.category), 0);
  const total = budgetProgress(totalLimit, totalSpent);

  return (
    <div>
      <PageHeader
        title={t("nav_budget")}
        subtitle={t("budget_sub")}
        actions={
          <Button onClick={() => setEditing({ open: true })}>
            <Plus /> {t("add_budget")}
          </Button>
        }
      />

      {budgets.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={<PiggyBank className="size-6" />}
            title={t("no_budgets")}
            subtitle={t("no_budgets_sub")}
            action={
              <Button onClick={() => setEditing({ open: true })}>
                <Plus /> {t("add_budget")}
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="bg-balance mb-6 rounded-3xl p-6 text-on-dark shadow-lift">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm text-on-dark-muted">
                  {t("total_budget")} · {t("this_month")}
                </p>
                <p className="tabular mt-1 font-display text-3xl font-bold">
                  {money(totalSpent)} <span className="text-lg text-on-dark-muted">/ {money(totalLimit)}</span>
                </p>
              </div>
              <p className="tabular font-display text-4xl font-bold text-accent">{total.percent}%</p>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-on-dark/15">
              <div
                className={total.status === "over" ? "h-full bg-expense" : total.status === "warning" ? "h-full bg-warning" : "h-full bg-accent"}
                style={{ width: `${Math.min(100, total.percent)}%` }}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {budgets.map((b) => {
              const spent = spentFor(b.category);
              const p = budgetProgress(b.monthly_limit, spent);
              const statusLabel = t(p.status === "over" ? "status_over" : p.status === "warning" ? "status_warning" : "status_ok");
              return (
                <div key={b.id} className="surface animate-rise p-5">
                  <div className="flex items-start gap-3">
                    <CategoryIcon category={b.category} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{cat(b.category)}</p>
                      <StatusPill status={p.status} label={statusLabel} />
                    </div>
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditing({ open: true, budget: b })} aria-label={t("edit")}>
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive"
                      aria-label={t("delete")}
                      onClick={async () => {
                        try {
                          await del.mutateAsync(b.id);
                          toast.success(t("deleted"));
                        } catch {
                          toast.error(t("error_generic"));
                        }
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <p className="tabular font-display text-xl font-bold">{money(spent)}</p>
                    <p className="tabular text-sm font-semibold">{p.percent}%</p>
                  </div>
                  <p className="tabular mb-2 text-xs text-muted-foreground">{t("of_limit", { amount: money(b.monthly_limit) })}</p>
                  <BudgetBar percent={p.percent} status={p.status} />
                  <p className={`tabular mt-2 text-xs font-medium ${p.remaining < 0 ? "text-expense" : "text-muted-foreground"}`}>
                    {p.remaining < 0
                      ? t("over_by", { amount: money(-p.remaining) })
                      : `${t("remaining")}: ${money(p.remaining)}`}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Dialog open={editing.open} onOpenChange={(o) => setEditing((s) => ({ ...s, open: o }))}>
        <DialogContent className="sm:max-w-md">
          {editing.open && (
            <BudgetForm
              budget={editing.budget}
              taken={budgets.map((b) => b.category)}
              onDone={() => setEditing({ open: false })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BudgetForm({ budget, taken, onDone }: { budget?: Budget; taken: string[]; onDone: () => void }) {
  const { t, cat } = useI18n();
  const save = useSaveBudget();
  const options = EXPENSE_CATEGORIES.filter((c) => c === budget?.category || !taken.includes(c));
  const [category, setCategory] = useState<string>(budget?.category ?? options[0] ?? "food");
  const [limit, setLimit] = useState(budget ? String(budget.monthly_limit) : "");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = Number(limit);
    if (!Number.isFinite(value) || value <= 0) return;
    try {
      await save.mutateAsync({ id: budget?.id, input: { category, monthly_limit: value } });
      toast.success(t("saved"));
      onDone();
    } catch (err) {
      const code = (err as { code?: string }).code;
      toast.error(code === "23505" ? t("budget_exists") : t("error_generic"));
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle className="font-display text-xl">{budget ? t("edit_budget") : t("add_budget")}</DialogTitle>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label>{t("category")}</Label>
        <Select value={category} onValueChange={setCategory} disabled={!!budget}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((c) => (
              <SelectItem key={c} value={c}>
                {cat(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="b-limit">{t("monthly_limit")}</Label>
        <Input id="b-limit" type="number" min="0" step="any" inputMode="decimal" required value={limit} onChange={(e) => setLimit(e.target.value)} className="tabular" />
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="ghost" onClick={onDone}>
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={save.isPending || options.length === 0}>
          {t("save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
