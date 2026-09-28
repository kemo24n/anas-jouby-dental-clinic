import { prisma } from '@/lib/db';

export type ReportRange = { from: Date; to: Date };

export function monthRange(reference = new Date()): ReportRange {
  const from = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const to = new Date(reference.getFullYear(), reference.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from, to };
}

export function dayRange(reference = new Date()): ReportRange {
  const from = new Date(reference);
  from.setHours(0, 0, 0, 0);
  const to = new Date(reference);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

export async function dashboardStats() {
  const today = dayRange();
  const month = monthRange();

  const [
    todayAppointments, todayPatients, upcoming, completed, cancelled,
    revenue, newPatients, openCases,
  ] = await Promise.all([
    prisma.appointment.count({ where: { startsAt: { gte: today.from, lte: today.to }, status: { notIn: ['CANCELLED'] } } }),
    prisma.appointment.findMany({
      where: { startsAt: { gte: today.from, lte: today.to } },
      select: { patientId: true },
      distinct: ['patientId'],
    }),
    prisma.appointment.count({ where: { startsAt: { gt: new Date() }, status: { in: ['BOOKED', 'CONFIRMED', 'RESCHEDULED'] } } }),
    prisma.appointment.count({ where: { status: 'COMPLETED', startsAt: { gte: month.from, lte: month.to } } }),
    prisma.appointment.count({ where: { status: { in: ['CANCELLED', 'NO_SHOW'] }, startsAt: { gte: month.from, lte: month.to } } }),
    prisma.payment.aggregate({ where: { deletedAt: null, paidAt: { gte: month.from, lte: month.to } }, _sum: { amount: true } }),
    prisma.patient.count({ where: { deletedAt: null, registeredAt: { gte: month.from, lte: month.to } } }),
    prisma.dentalCase.count({ where: { deletedAt: null, status: { in: ['OPEN', 'IN_TREATMENT'] } } }),
  ]);

  return {
    todayAppointments,
    todayPatients: todayPatients.length,
    upcoming,
    completed,
    cancelled,
    revenue: Number(revenue._sum.amount ?? 0),
    newPatients,
    openCases,
  };
}

/** عدد المواعيد لكل يوم خلال آخر 14 يوماً — لرسم المخطط. */
export async function appointmentsTrend(days = 14) {
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  from.setHours(0, 0, 0, 0);

  const rows = await prisma.appointment.findMany({
    where: { startsAt: { gte: from } },
    select: { startsAt: true, status: true },
  });

  const buckets = new Map<string, { date: string; total: number; completed: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { date: `${d.getDate()}/${d.getMonth() + 1}`, total: 0, completed: 0 });
  }
  for (const row of rows) {
    const key = row.startsAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.total += 1;
    if (row.status === 'COMPLETED') bucket.completed += 1;
  }
  return [...buckets.values()];
}

export async function revenueByMonth(months = 6) {
  const from = new Date();
  from.setMonth(from.getMonth() - (months - 1), 1);
  from.setHours(0, 0, 0, 0);

  const payments = await prisma.payment.findMany({
    where: { deletedAt: null, paidAt: { gte: from } },
    select: { paidAt: true, amount: true },
  });

  const names = ['ك2', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'ت1', 'ت2', 'ك1'];
  const buckets = new Map<string, { month: string; total: number }>();
  for (let i = 0; i < months; i++) {
    const d = new Date(from.getFullYear(), from.getMonth() + i, 1);
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, { month: names[d.getMonth()], total: 0 });
  }
  for (const p of payments) {
    const key = `${p.paidAt.getFullYear()}-${p.paidAt.getMonth()}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.total += Number(p.amount);
  }
  return [...buckets.values()];
}

export async function topServices(limit = 6) {
  const grouped = await prisma.appointment.groupBy({
    by: ['serviceId'],
    _count: { serviceId: true },
    orderBy: { _count: { serviceId: 'desc' } },
    take: limit,
    where: { serviceId: { not: null } },
  });
  const services = await prisma.service.findMany({
    where: { id: { in: grouped.map((g) => g.serviceId!).filter(Boolean) } },
    select: { id: true, name: true },
  });
  return grouped.map((g) => ({
    name: services.find((s) => s.id === g.serviceId)?.name ?? 'غير محدد',
    count: g._count.serviceId,
  }));
}

export async function outstandingBalances(limit = 20) {
  const patients = await prisma.patient.findMany({
    where: { deletedAt: null },
    select: {
      id: true, code: true, fullName: true, phone: true,
      payments: { where: { deletedAt: null }, select: { amount: true } },
      treatmentPlans: {
        where: { deletedAt: null, status: { in: ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] } },
        select: { items: { select: { estimatedCost: true, actualCost: true, status: true } } },
      },
    },
  });

  return patients
    .map((p) => {
      const charged = p.treatmentPlans.flatMap((plan) => plan.items)
        .filter((i) => i.status !== 'REJECTED')
        .reduce((sum, i) => sum + Number(i.actualCost ?? i.estimatedCost), 0);
      const paid = p.payments.reduce((sum, i) => sum + Number(i.amount), 0);
      return { id: p.id, code: p.code, fullName: p.fullName, phone: p.phone, charged, paid, balance: charged - paid };
    })
    .filter((row) => row.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit);
}
