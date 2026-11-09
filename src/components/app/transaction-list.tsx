import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "./category-icon";
import { useTxDialog } from "./transaction-dialog";
import type { Tx } from "@/lib/finance";
import { useI18n } from "@/lib/i18n";
import { useDeleteTransaction } from "@/lib/queries";
import { useCards, useMoney } from "@/hooks/use-wallet";
import { cn } from "@/lib/utils";

export function TransactionList({ items, compact }: { items: Tx[]; compact?: boolean }) {
  const { t, cat, lang } = useI18n();
  const money = useMoney();
  const cards = useCards();
  const { open } = useTxDialog();
  const del = useDeleteTransaction();
  const [toDelete, setToDelete] = useState<Tx | null>(null);
  const dateFmt = new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    year: compact ? undefined : "numeric",
  });

  return (
    <>
      <ul className="divide-y divide-border">
        {items.map((tx) => {
          const card = tx.card_id ? cards.find((c) => c.id === tx.card_id) : undefined;
          return (
            <li key={tx.id} className="group flex items-center gap-3 py-3">
              <CategoryIcon category={tx.category} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{tx.description || cat(tx.category)}</p>
                <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  <span>{cat(tx.category)}</span>
                  <span aria-hidden>·</span>
                  <span>{dateFmt.format(new Date(tx.occurred_on + "T00:00:00"))}</span>
                  {card && (
                    <span className="inline-flex items-center gap-1">
                      <CreditCard className="size-3" />
                      {card.last4}
                    </span>
                  )}
                </p>
              </div>
              <p
                className={cn(
                  "tabular shrink-0 text-sm font-bold",
                  tx.type === "income" ? "text-income" : "text-expense",
                )}
              >
                {tx.type === "income" ? "+" : "−"}
                {money(tx.amount)}
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label={t("edit")}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => open({ tx })}>
                    <Pencil className="size-4" /> {t("edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => setToDelete(tx)}>
                    <Trash2 className="size-4" /> {t("delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          );
        })}
      </ul>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_transaction")}</AlertDialogTitle>
            <AlertDialogDescription>{t("delete_confirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!toDelete) return;
                try {
                  await del.mutateAsync(toDelete.id);
                  toast.success(t("deleted"));
                } catch {
                  toast.error(t("error_generic"));
                }
                setToDelete(null);
              }}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
