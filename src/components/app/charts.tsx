import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { categoryColor, formatCompact } from "@/lib/finance";
import { useI18n } from "@/lib/i18n";
import { useMoney } from "@/hooks/use-wallet";

export function CashFlowChart({ data }: { data: { key: string; income: number; expense: number }[] }) {
  const { t, lang } = useI18n();
  const money = useMoney();
  const monthFmt = new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", { month: "short" });
  const rows = data.map((d) => ({
    ...d,
    label: monthFmt.format(new Date(d.key + "-01T00:00:00")),
  }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} barGap={4} margin={{ left: -12, right: 4, top: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={11}
            stroke="var(--muted-foreground)"
            tickFormatter={(v: number) => formatCompact(v, lang)}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--popover)",
              fontSize: 12,
            }}
            formatter={(v: number, name: string) => [money(v), t(name as "income" | "expense")]}
          />
          <Bar dataKey="income" fill="var(--income)" radius={[6, 6, 0, 0]} maxBarSize={22} />
          <Bar dataKey="expense" fill="var(--expense)" radius={[6, 6, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryDonut({ data }: { data: { category: string; amount: number }[] }) {
  const { cat } = useI18n();
  const money = useMoney();
  const total = data.reduce((s, d) => s + d.amount, 0);
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
      <div className="relative size-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.category} fill={categoryColor(d.category)} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <p className="tabular font-display text-base font-bold leading-tight">{money(total)}</p>
        </div>
      </div>
      <ul className="w-full space-y-2">
        {data.slice(0, 6).map((d) => (
          <li key={d.category} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: categoryColor(d.category) }} />
            <span className="flex-1 truncate text-muted-foreground">{cat(d.category)}</span>
            <span className="tabular font-semibold">{total ? Math.round((d.amount / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
