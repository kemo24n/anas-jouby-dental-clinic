'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const AXIS = { fontSize: 12, fill: '#6F6264' };
const PALETTE = ['#A85A72', '#E8B0B6', '#C9AA84', '#5E9E7A', '#C98A9D', '#DFC7A7'];

const tooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: '1px solid #F1E5E3',
    fontSize: 12,
    fontFamily: 'inherit',
    direction: 'rtl' as const,
  },
};

export function AppointmentsTrendChart({ data }: { data: { date: string; total: number; completed: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="total" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A85A72" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#A85A72" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1E5E3" vertical={false} />
        <XAxis dataKey="date" tick={AXIS} axisLine={false} tickLine={false} reversed />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} orientation="right" allowDecimals={false} width={32} />
        <Tooltip {...tooltipStyle} formatter={(value: number, key) => [value, key === 'total' ? 'إجمالي المواعيد' : 'مكتملة']} />
        <Area type="monotone" dataKey="total" stroke="#A85A72" strokeWidth={2} fill="url(#total)" />
        <Area type="monotone" dataKey="completed" stroke="#5E9E7A" strokeWidth={2} fill="transparent" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RevenueChart({ data }: { data: { month: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1E5E3" vertical={false} />
        <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} reversed />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} orientation="right" width={48} />
        <Tooltip {...tooltipStyle} formatter={(value: number) => [value, 'الإيرادات']} cursor={{ fill: '#FCF4F6' }} />
        <Bar dataKey="total" fill="#C9AA84" radius={[8, 8, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopServicesChart({ data }: { data: { name: string; count: number }[] }) {
  if (!data.length) return <p className="py-10 text-center text-sm text-muted">لا توجد بيانات كافية بعد.</p>;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="name" innerRadius={52} outerRadius={84} paddingAngle={2}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
          ))}
        </Pie>
        <Legend wrapperStyle={{ fontSize: 12, direction: 'rtl' }} />
        <Tooltip {...tooltipStyle} formatter={(value: number) => [value, 'عدد المواعيد']} />
      </PieChart>
    </ResponsiveContainer>
  );
}
