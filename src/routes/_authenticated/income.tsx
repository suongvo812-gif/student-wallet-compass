import { createFileRoute } from "@tanstack/react-router";
import { LedgerPage } from "@/components/app/ledger-page";

export const Route = createFileRoute("/_authenticated/income")({
  head: () => ({
    meta: [
      { title: "Income · Student Wallet" },
      { name: "description", content: "Track every source of income: allowance, part-time jobs, scholarships." },
      { property: "og:title", content: "Income · Student Wallet" },
      { property: "og:description", content: "Track every source of income." },
    ],
  }),
  component: () => <LedgerPage type="income" />,
});
