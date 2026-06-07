"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axis = {
  stroke: "hsl(var(--muted-foreground))",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-xl">
      {label && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="capitalize">{p.name}:</span>
          <span className="font-medium text-foreground tabular-nums">
            {p.value.toLocaleString()}
          </span>
        </p>
      ))}
    </div>
  );
}

export function AttendanceAreaChart({
  data,
}: {
  data: { day: string; present: number; absent: number; late: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gLate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c52a58" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#c52a58" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="day" {...axis} />
        <YAxis {...axis} width={48} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "hsl(var(--border))" }} />
        <Area type="monotone" dataKey="present" stroke="#f59e0b" strokeWidth={2} fill="url(#gPresent)" />
        <Area type="monotone" dataKey="late" stroke="#c52a58" strokeWidth={2} fill="url(#gLate)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function OccupancyAreaChart({
  data,
}: {
  data: { hour: string; occupancy: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="gOcc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c52a58" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#c52a58" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="hour" {...axis} interval={1} />
        <YAxis {...axis} width={48} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "hsl(var(--border))" }} />
        <Area type="monotone" dataKey="occupancy" stroke="#c52a58" strokeWidth={2} fill="url(#gOcc)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DepartmentBarChart({ data }: { data: { name: string; rate: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <XAxis dataKey="name" {...axis} />
        <YAxis {...axis} width={48} domain={[60, 100]} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--accent))" }} />
        <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={i % 2 === 0 ? "#f59e0b" : "#c52a58"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MealDonutChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={3}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
            <span className="flex-1 text-muted-foreground">{d.name}</span>
            <span className="font-medium tabular-nums">
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
