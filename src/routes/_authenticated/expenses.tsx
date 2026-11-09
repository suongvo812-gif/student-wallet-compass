import { createFileRoute } from "@tanstack/react-router";
import { LedgerPage } from "@/components/app/ledger-page";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses · Student Wallet" },
      { name: "description", content: "See where your money goes, category by category." },
      { property: "og:title", content: "Expenses · Student Wallet" },
      { property: "og:description", content: "See where your money goes." },
    ],
  }),
  component: () => <LedgerPage type="expense" />,
});
