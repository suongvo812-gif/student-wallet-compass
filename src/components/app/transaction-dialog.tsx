import { createContext, useCallback, useContext, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, toDateKey, type Tx, type TxType } from "@/lib/finance";
import { useI18n } from "@/lib/i18n";
import { useSaveTransaction } from "@/lib/queries";
import { useCards } from "@/hooks/use-wallet";
import { cn } from "@/lib/utils";

type OpenOpts = { type?: TxType; tx?: Tx };

const Ctx = createContext<{ open: (opts?: OpenOpts) => void } | null>(null);

export function useTxDialog() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTxDialog outside provider");
  return v;
}

export function TxDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; opts: OpenOpts; nonce: number }>({
    open: false,
    opts: {},
    nonce: 0,
  });
  const open = useCallback(
    (opts: OpenOpts = {}) => setState((s) => ({ open: true, opts, nonce: s.nonce + 1 })),
    [],
  );
  return (
    <Ctx.Provider value={{ open }}>
      {children}
      <Dialog open={state.open} onOpenChange={(o) => setState((s) => ({ ...s, open: o }))}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
          <TxForm
            key={state.nonce}
            opts={state.opts}
            onDone={() => setState((s) => ({ ...s, open: false }))}
          />
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}

function TxForm({ opts, onDone }: { opts: OpenOpts; onDone: () => void }) {
  const { t, cat } = useI18n();
  const cards = useCards();
  const save = useSaveTransaction();
  const editing = opts.tx;
  const [type, setType] = useState<TxType>(editing?.type ?? opts.type ?? "expense");
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [category, setCategory] = useState(editing?.category ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [date, setDate] = useState(editing?.occurred_on ?? toDateKey(new Date()));
  const [cardId, setCardId] = useState<string>(editing?.card_id ?? "none");
  const [error, setError] = useState<string | null>(null);

  const categories: readonly string[] = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const effectiveCategory = categories.includes(category) ? category : categories[0];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError(t("amount") + " > 0");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError(t("date"));
      return;
    }
    setError(null);
    try {
      await save.mutateAsync({
        id: editing?.id,
        input: {
          type,
          amount: Math.round(value * 100) / 100,
          category: effectiveCategory,
          description: description.trim().slice(0, 200),
          occurred_on: date,
          card_id: type === "expense" && cardId !== "none" ? cardId : null,
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
        <DialogTitle className="font-display text-xl">
          {editing ? t("edit_transaction") : t("add_transaction")}
        </DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
        {(["expense", "income"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setType(k)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition",
              type === k
                ? k === "income"
                  ? "bg-card text-income shadow-sm"
                  : "bg-card text-expense shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {k === "income" ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
            {t(k)}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tx-amount">{t("amount")}</Label>
        <Input
          id="tx-amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          required
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="tabular h-12 font-display text-xl font-semibold"
          placeholder="0"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{t("category")}</Label>
          <Select value={effectiveCategory} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {cat(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tx-date">{t("date")}</Label>
          <Input id="tx-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tx-desc">{t("description")}</Label>
        <Input
          id="tx-desc"
          maxLength={200}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("description_ph")}
        />
      </div>

      {type === "expense" && cards.length > 0 && (
        <div className="space-y-1.5">
          <Label>{t("card_optional")}</Label>
          <Select value={cardId} onValueChange={setCardId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("no_card")}</SelectItem>
              {cards.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} •••• {c.last4}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="ghost" onClick={onDone}>
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? t("loading") : t("save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
