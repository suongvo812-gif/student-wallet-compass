import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, ReceiptText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, EmptyState } from "@/components/app/page-header";
import { TransactionList } from "@/components/app/transaction-list";
import { useTxDialog } from "@/components/app/transaction-dialog";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, monthKeyOf, summarize } from "@/lib/finance";
import { useI18n } from "@/lib/i18n";
import { useMoney, useTransactions } from "@/hooks/use-wallet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions · Student Wallet" },
      { name: "description", content: "Your full transaction history with search and filters." },
      { property: "og:title", content: "Transactions · Student Wallet" },
      { property: "og:description", content: "Your full transaction history." },
    ],
  }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const { t, cat, lang } = useI18n();
  const money = useMoney();
  const txs = useTransactions();
  const { open } = useTxDialog();
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [category, setCategory] = useState("all");
  const [month, setMonth] = useState("all");
  const [q, setQ] = useState("");

  const months = useMemo(() => [...new Set(txs.map((x) => monthKeyOf(x.occurred_on)))], [txs]);
  const monthFmt = new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", { month: "long", year: "numeric" });

  const filtered = txs.filter(
    (x) =>
      (type === "all" || x.type === type) &&
      (category === "all" || x.category === category) &&
      (month === "all" || x.occurred_on.startsWith(month)) &&
      (!q || (x.description + " " + cat(x.category)).toLowerCase().includes(q.trim().toLowerCase())),
  );
  const s = summarize(filtered);

  return (
    <div>
      <PageHeader
        title={t("nav_transactions")}
        subtitle={t("transactions_sub")}
        actions={
          <Button onClick={() => open()}>
            <Plus /> {t("add_transaction")}
          </Button>
        }
      />

      <div className="surface p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex rounded-xl bg-muted p-1 text-sm font-semibold">
            {(["all", "income", "expense"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setType(k)}
                className={cn(
                  "flex-1 rounded-lg px-4 py-1.5 transition lg:flex-none",
                  type === k ? "bg-card shadow-sm" : "text-muted-foreground",
                )}
              >
                {k === "all" ? t("all") : t(k)}
              </button>
            ))}
          </div>
          <div className="grid flex-1 gap-3 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="pl-9" />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all_categories")}</SelectItem>
                {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((c) => (
                  <SelectItem key={c} value={c}>
                    {cat(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all_time")}</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m} value={m}>
                    {monthFmt.format(new Date(m + "-01T00:00:00"))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-b border-border pb-3 text-sm">
          <span className="text-muted-foreground">{t("count_items", { n: filtered.length })}</span>
          <span className="tabular font-semibold text-income">+{money(s.income)}</span>
          <span className="tabular font-semibold text-expense">−{money(s.expense)}</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<ReceiptText className="size-6" />} title={t("no_transactions")} subtitle={t("no_transactions_sub")} />
        ) : (
          <TransactionList items={filtered} />
        )}
      </div>
    </div>
  );
}
