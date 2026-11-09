import { describe, expect, it } from "vitest";
import { budgetProgress, inMonth, monthlySeries, summarize, type Tx } from "./finance";

const tx = (p: Partial<Tx>): Tx => ({
  id: Math.random().toString(),
  type: "expense",
  amount: 0,
  category: "food",
  description: "",
  occurred_on: "2026-11-05",
  card_id: null,
  created_at: "",
  ...p,
});

describe("balance", () => {
  it("balance is total income minus total expenses", () => {
    const s = summarize([
      tx({ type: "income", amount: 3_000_000 }),
      tx({ type: "expense", amount: 450_000 }),
      tx({ type: "expense", amount: 50_000 }),
    ]);
    expect(s).toEqual({ income: 3_000_000, expense: 500_000, balance: 2_500_000 });
  });

  it("monthly totals only count transactions in that month", () => {
    const list = [
      tx({ type: "expense", amount: 100, occurred_on: "2026-10-31" }),
      tx({ type: "expense", amount: 200, occurred_on: "2026-11-01" }),
    ];
    expect(summarize(inMonth(list, "2026-11")).expense).toBe(200);
    const series = monthlySeries(list, 2, "2026-11");
    expect(series.map((m) => m.expense)).toEqual([100, 200]);
  });
});

describe("budget progress", () => {
  it("is ok below 80%", () => {
    expect(budgetProgress(1_000_000, 790_000).status).toBe("ok");
  });
  it("warns from 80% spent", () => {
    expect(budgetProgress(1_000_000, 800_000)).toMatchObject({ percent: 80, status: "warning" });
  });
  it("is over once spending exceeds the limit", () => {
    expect(budgetProgress(1_000_000, 1_200_000)).toMatchObject({
      percent: 120,
      status: "over",
      remaining: -200_000,
    });
  });
});
