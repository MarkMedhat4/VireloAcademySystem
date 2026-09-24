"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { colors } from "@/design-system/tokens";

const noop = () => () => {};
/** true only after hydration → charts never render on the server (ResponsiveContainer needs a DOM). */
function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}

function ChartCard({ title, subtitle, label, children }: { title: string; subtitle?: string; label: string; children: ReactNode }) {
  const mounted = useMounted();
  return (
    <Card className="p-5">
      <h3 className="text-base">{title}</h3>
      {subtitle && <p className="text-sm text-ink-2">{subtitle}</p>}
      <div className="mt-4 h-64 w-full" dir="ltr" role="img" aria-label={label}>
        {mounted ? <ResponsiveContainer width="100%" height="100%">{children as React.ReactElement}</ResponsiveContainer> : <Skeleton className="h-full w-full" />}
      </div>
    </Card>
  );
}

function GradeTick({ x = 0, y = 0, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  const value = payload?.value ?? "";
  const words = value.split(" ");
  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" fill={colors.textSecondary} fontSize={11}>
        {words.map((w, i) => (
          <tspan key={i} x={0} dy={14}>{w}</tspan>
        ))}
      </text>
    </g>
  );
}

const axis = { stroke: colors.border, tick: { fill: colors.textSecondary, fontSize: 12 }, tickLine: false } as const;
const tooltipStyle = {
  contentStyle: { borderRadius: 12, border: `1px solid ${colors.border}`, boxShadow: "0 8px 24px rgba(7,26,51,.08)", direction: "rtl" as const, fontFamily: "inherit" },
  labelStyle: { color: colors.navy, fontWeight: 700 },
  cursor: { fill: "rgba(212,175,55,0.08)" },
};

export function StudentsByGradeChart({ data }: { data: Array<{ grade: string; count: number }> }) {
  return (
    <ChartCard title="الطلاب حسب الصف" label="رسم بياني لعدد الطلاب في كل صف دراسي">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 16 }}>
        <CartesianGrid vertical={false} stroke={colors.border} />
        <XAxis dataKey="grade" {...axis} tick={<GradeTick />} interval={0} height={64} />
        <YAxis allowDecimals={false} {...axis} />
        <Tooltip {...tooltipStyle} formatter={(v) => [String(v), "عدد الطلاب"]} />
        <Bar dataKey="count" fill={colors.navy} radius={[8, 8, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ChartCard>
  );
}

export function PaymentsByGradeChart({ data }: { data: Array<{ grade: string; count: number; amount: number }> }) {
  return (
    <ChartCard title="المدفوعات حسب الصف" subtitle="عدد عمليات الدفع (بدون المرفوضة)" label="رسم بياني لعدد عمليات الدفع في كل صف دراسي">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 16 }}>
        <CartesianGrid vertical={false} stroke={colors.border} />
        <XAxis dataKey="grade" {...axis} tick={<GradeTick />} interval={0} height={64} />
        <YAxis allowDecimals={false} {...axis} />
        <Tooltip {...tooltipStyle} formatter={(v) => [String(v), "عمليات الدفع"]} />
        <Bar dataKey="count" fill={colors.gold} radius={[8, 8, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ChartCard>
  );
}

export function DailyPaymentsChart({ data }: { data: Array<{ label: string; count: number }> }) {
  return (
    <ChartCard title="المدفوعات اليومية" subtitle="آخر 30 يوماً" label="رسم بياني لعدد المدفوعات اليومية خلال آخر ثلاثين يوماً">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="dailyFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.gold} stopOpacity={0.35} />
            <stop offset="100%" stopColor={colors.gold} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={colors.border} />
        <XAxis dataKey="label" interval="preserveStartEnd" minTickGap={24} {...axis} />
        <YAxis allowDecimals={false} {...axis} />
        <Tooltip {...tooltipStyle} formatter={(v) => [String(v), "عمليات الدفع"]} />
        <Area type="linear" dataKey="count" stroke={colors.navy} strokeWidth={2} fill="url(#dailyFill)" />
      </AreaChart>
    </ChartCard>
  );
}

export function MonthlyRevenueChart({ data }: { data: Array<{ month: string; amount: number }> }) {
  return (
    <ChartCard title="الإيراد الشهري" subtitle="بالجنيه المصري — آخر 6 أشهر" label="رسم بياني للإيراد الشهري خلال آخر ستة أشهر">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={colors.border} />
        <XAxis dataKey="month" {...axis} />
        <YAxis allowDecimals={false} {...axis} />
        <Tooltip {...tooltipStyle} formatter={(v) => [`${v} ج.م`, "الإيراد"]} />
        <Bar dataKey="amount" fill={colors.gold} radius={[8, 8, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ChartCard>
  );
}
