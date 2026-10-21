import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { REVENUE_TREND } from "@/lib/crm-data";

const tip = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    fontSize: 12.5,
    fontWeight: 500,
    color: "var(--foreground)",
    boxShadow: "var(--shadow-pop)",
  },
  cursor: { stroke: "var(--border-strong)" },
};

const axis = {
  tick: { fill: "var(--muted-foreground)", fontSize: 11.5, fontWeight: 500 },
  tickLine: false,
  axisLine: false,
} as const;

export function RevenueArea({
  height = 220,
  data,
}: {
  height?: number;
  data?: { m: string; revenue: number; target: number }[];
}) {
  const chartData = data && data.length > 0 ? data : REVENUE_TREND;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
        <defs><linearGradient id="rv" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--primary)" stopOpacity={0.3} /><stop offset="1" stopColor="var(--primary)" stopOpacity={0} /></linearGradient></defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
        <XAxis dataKey="m" {...axis} /><YAxis {...axis} tickFormatter={(v) => `${v}L`} />
        <Tooltip {...tip} formatter={(v: any) => (typeof v === "number" ? `₹${v.toFixed(1)}L` : String(v))} />
        <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} fill="url(#rv)" />
        <Line type="monotone" dataKey="target" stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function Bars({ data, x, y, height = 220 }: { data: Record<string, unknown>[]; x: string; y: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
        <XAxis dataKey={x} {...axis} /><YAxis {...axis} />
        <Tooltip {...tip} cursor={{ fill: "var(--secondary)" }} />
        <Bar dataKey={y} fill="var(--primary)" radius={[3, 3, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
export function Donut({ data, height = 200 }: { data: { name: string; value: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Tooltip {...tip} />
        <Pie data={data} dataKey="value" innerRadius="62%" outerRadius="90%" paddingAngle={2} stroke="none">
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
export const CHART_COLORS = COLORS;
