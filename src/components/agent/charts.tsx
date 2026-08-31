"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const PALETTE = ["#1d3a66", "#2b4d80", "#4a6fa3", "#7d9cc4", "#b31942", "#b8860b"];

export function StatusPie({ data }: { data: { name: string; value: number }[] }) {
  const filtered = data.filter((d) => d.value > 0);
  if (filtered.length === 0) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={filtered} dataKey="value" nameKey="name" outerRadius={80} label>
          {filtered.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CategoryBar({ data }: { data: { name: string; value: number }[] }) {
  if (data.every((d) => d.value === 0)) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="value" fill="#1d3a66" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendLine({
  data,
}: {
  data: { month: string; opened: number; closed: number }[];
}) {
  if (data.length === 0) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="opened" stroke="#1d3a66" strokeWidth={2} name="Opened" />
        <Line type="monotone" dataKey="closed" stroke="#b31942" strokeWidth={2} name="Closed" />
      </LineChart>
    </ResponsiveContainer>
  );
}

function Empty() {
  return (
    <div className="flex h-[240px] items-center justify-center text-sm text-navy-400">
      No data yet
    </div>
  );
}
