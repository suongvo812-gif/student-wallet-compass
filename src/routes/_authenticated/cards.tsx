import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, Nfc, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader, EmptyState } from "@/components/app/page-header";
import { BudgetBar } from "@/components/app/budget-bar";
import { TransactionList } from "@/components/app/transaction-list";
import { budgetProgress, inMonth } from "@/lib/finance";
import { useI18n } from "@/lib/i18n";
import { useDeleteCard, useSaveCard, type Card } from "@/lib/queries";
import { currentMonthKey, useCards, useDisplayName, useMoney, useTransactions } from "@/hooks/use-wallet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/cards")({
  head: () => ({
    meta: [
      { title: "Credit cards · Student Wallet" },
      { name: "description", content: "Track your credit cards, limits, due dates and spending." },
      { property: "og:title", content: "Credit cards · Student Wallet" },
      { property: "og:description", content: "Credit card limits, due dates and spending." },
    ],
  }),
  component: CardsPage,
});

const SKINS = ["primary", "coral", "ink", "ocean"] as const;
const skinClass: Record<string, string> = {
  primary: "skin-primary",
  coral: "skin-coral",
  ink: "skin-ink",
  ocean: "skin-ocean",
};

function CardVisual({ card }: { card: Pick<Card, "name" | "bank" | "last4" | "holder" | "expiry" | "color"> }) {
  return (
    <div
      className={cn(
        "relative aspect-[1.586] w-full overflow-hidden rounded-2xl p-5 text-on-dark shadow-lift",
        skinClass[card.color] ?? "skin-primary",
      )}
    >
      <div className="dot-grid absolute inset-0 opacity-40" aria-hidden />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-on-dark-muted">{card.bank || "Bank"}</p>
            <p className="font-display text-lg font-bold">{card.name || "Card"}</p>
          </div>
          <Nfc className="size-6 opacity-80" />
        </div>
        <p className="tabular font-display text-lg tracking-[0.2em] sm:text-xl">•••• •••• •••• {card.last4 || "0000"}</p>
        <div className="flex items-end justify-between text-xs">
          <div>
            <p className="text-on-dark-muted">Card holder</p>
            <p className="font-semibold uppercase">{card.holder || "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-on-dark-muted">Exp</p>
            <p className="font-semibold">{card.expiry || "--/--"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardsPage() {
  const { t } = useI18n();
  const money = useMoney();
  const cards = useCards();
  const txs = useTransactions();
  const del = useDeleteCard();
  const [editing, setEditing] = useState<{ open: boolean; card?: Card }>({ open: false });
  const monthTx = inMonth(txs, currentMonthKey());
  const cardTx = txs.filter((x) => x.card_id);

  return (
    <div>
      <PageHeader
        title={t("nav_cards")}
        subtitle={t("cards_sub")}
        actions={
          <Button onClick={() => setEditing({ open: true })}>
            <Plus /> {t("add_card")}
          </Button>
        }
      />

      {cards.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={<CreditCard className="size-6" />}
            title={t("no_cards")}
            subtitle={t("no_cards_sub")}
            action={
              <Button onClick={() => setEditing({ open: true })}>
                <Plus /> {t("add_card")}
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => {
            const used = monthTx.filter((x) => x.card_id === c.id && x.type === "expense").reduce((s, x) => s + x.amount, 0);
            const p = budgetProgress(c.credit_limit, used);
            return (
              <div key={c.id} className="surface animate-rise p-4">
                <CardVisual card={c} />
                <div className="mt-4 space-y-3 px-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("used_this_month")}</span>
                    <span className="tabular font-bold">{money(used)}</span>
                  </div>
                  {c.credit_limit > 0 && (
                    <>
                      <BudgetBar percent={p.percent} status={p.status} />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {t("utilization")}: {p.percent}%
                        </span>
                        <span className="tabular">
                          {t("available")}: {money(Math.max(0, p.remaining))}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {c.due_day ? t("due_on", { day: c.due_day }) : ""}
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="size-8" aria-label={t("edit")} onClick={() => setEditing({ open: true, card: c })}>
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        aria-label={t("delete")}
                        onClick={async () => {
                          try {
                            await del.mutateAsync(c.id);
                            toast.success(t("deleted"));
                          } catch {
                            toast.error(t("error_generic"));
                          }
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cardTx.length > 0 && (
        <div className="surface mt-6 p-5">
          <h2 className="mb-1 text-lg font-bold">{t("card_transactions")}</h2>
          <TransactionList items={cardTx.slice(0, 20)} />
        </div>
      )}

      <Dialog open={editing.open} onOpenChange={(o) => setEditing((s) => ({ ...s, open: o }))}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          {editing.open && <CardForm card={editing.card} onDone={() => setEditing({ open: false })} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CardForm({ card, onDone }: { card?: Card | undefined; onDone: () => void }) {
  const { t } = useI18n();
  const name = useDisplayName();
  const save = useSaveCard();
  const [form, setForm] = useState({
    name: card?.name ?? "",
    bank: card?.bank ?? "",
    last4: card?.last4 ?? "",
    holder: card?.holder ?? name,
    expiry: card?.expiry ?? "",
    credit_limit: card ? String(card.credit_limit) : "",
    due_day: card?.due_day ? String(card.due_day) : "",
    color: card?.color ?? "primary",
  });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(form.last4)) {
      toast.error(t("last4"));
      return;
    }
    const due = form.due_day ? Number(form.due_day) : null;
    try {
      await save.mutateAsync({
        id: card?.id,
        input: {
          name: form.name.trim().slice(0, 60),
          bank: form.bank.trim().slice(0, 60),
          last4: form.last4,
          holder: form.holder.trim().slice(0, 60),
          expiry: form.expiry.trim().slice(0, 5),
          credit_limit: Number(form.credit_limit) || 0,
          due_day: due && due >= 1 && due <= 31 ? due : null,
          color: form.color,
        },
      });
      toast.success(t("saved"));
      onDone();
    } catch {
      toast.error(t("error_generic"));
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle className="font-display text-xl">{card ? t("edit_card") : t("add_card")}</DialogTitle>
      </DialogHeader>
      <CardVisual card={form} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="c-name">{t("card_name")}</Label>
          <Input id="c-name" required maxLength={60} value={form.name} onChange={set("name")} placeholder={t("card_name_ph")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-bank">{t("bank")}</Label>
          <Input id="c-bank" maxLength={60} value={form.bank} onChange={set("bank")} placeholder="Vietcombank" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-last4">{t("last4")}</Label>
          <Input id="c-last4" required inputMode="numeric" maxLength={4} pattern="\d{4}" value={form.last4} onChange={set("last4")} placeholder="1234" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-exp">{t("expiry")}</Label>
          <Input id="c-exp" maxLength={5} value={form.expiry} onChange={set("expiry")} placeholder="08/29" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="c-holder">{t("holder")}</Label>
          <Input id="c-holder" maxLength={60} value={form.holder} onChange={set("holder")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-limit">{t("credit_limit")}</Label>
          <Input id="c-limit" type="number" min="0" step="any" value={form.credit_limit} onChange={set("credit_limit")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-due">{t("due_day")}</Label>
          <Input id="c-due" type="number" min="1" max="31" value={form.due_day} onChange={set("due_day")} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>{t("color")}</Label>
        <div className="flex gap-2">
          {SKINS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setForm((f) => ({ ...f, color: s }))}
              className={cn("size-9 rounded-full ring-offset-2 ring-offset-background transition", skinClass[s], form.color === s && "ring-2 ring-ring")}
              aria-label={s}
              aria-pressed={form.color === s}
            />
          ))}
        </div>
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="ghost" onClick={onDone}>
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {t("save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
