import Link from 'next/link';
import { CalendarDays, Plus } from 'lucide-react';
import { requireRole } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { can } from '@/lib/permissions';
import { appointmentsTrend, dashboardStats, dayRange, revenueByMonth, topServices } from '@/services/reports.service';
import { PageHeader, StatCard, Td, TableWrap, Th } from '@/components/dashboard/primitives';
import { AppointmentsTrendChart, RevenueChart, TopServicesChart } from '@/components/dashboard/charts';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/states';
import { appointmentStatusLabels, appointmentStatusTone } from '@/lib/labels';
import { formatArabicDate, formatArabicTime, formatMoney } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DashboardHome() {
  const session = await requireRole('ADMIN', 'DENTIST', 'RECEPTIONIST');
  const showReports = can(session.role, 'reports.read');
  const today = dayRange();

  const [stats, todaySchedule, trend, revenue, services] = await Promise.all([
    dashboardStats(),
    prisma.appointment.findMany({
      where: { startsAt: { gte: today.from, lte: today.to } },
      orderBy: { startsAt: 'asc' },
      include: {
        patient: { select: { id: true, fullName: true, phone: true, code: true } },
        service: { select: { name: true } },
      },
    }),
    showReports ? appointmentsTrend() : Promise.resolve([]),
    showReports ? revenueByMonth() : Promise.resolve([]),
    showReports ? topServices() : Promise.resolve([]),
  ]);

  return (
    <div className="animate-rise">
      <PageHeader
        title={`أهلاً، ${session.name}`}
        description={formatArabicDate(new Date())}
        action={
          <Link
            href="/dashboard/appointments"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-orchid-500 px-5 text-sm font-medium text-white hover:bg-orchid-600"
          >
            <Plus size={17} />
            موعد جديد
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="مواعيد اليوم" value={stats.todayAppointments} href="/dashboard/appointments" />
        <StatCard label="المرضى اليوم" value={stats.todayPatients} tone="rose" />
        <StatCard label="المواعيد القادمة" value={stats.upcoming} tone="gold" />
        <StatCard label="المواعيد المكتملة (هذا الشهر)" value={stats.completed} tone="ok" />
        <StatCard label="المواعيد الملغاة (هذا الشهر)" value={stats.cancelled} tone="danger" />
        <StatCard label="المرضى الجدد (هذا الشهر)" value={stats.newPatients} href="/dashboard/patients" />
        <StatCard label="الحالات المفتوحة" value={stats.openCases} href="/dashboard/cases" tone="rose" />
        {showReports && <StatCard label="الإيرادات (هذا الشهر)" value={formatMoney(stats.revenue)} tone="gold" />}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="جدول اليوم"
            description="المواعيد المسجّلة لهذا اليوم بالترتيب الزمني."
            action={
              <Link href="/dashboard/appointments" className="text-sm text-orchid-600 hover:underline">
                عرض التقويم
              </Link>
            }
          />
          <CardBody className="px-0 py-0">
            {todaySchedule.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<CalendarDays size={28} />}
                  title="لا توجد مواعيد اليوم"
                  description="يمكنك إضافة موعد جديد من صفحة المواعيد."
                  actionLabel="إضافة موعد"
                  actionHref="/dashboard/appointments"
                />
              </div>
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <Th>الوقت</Th>
                    <Th>المريض</Th>
                    <Th>الخدمة</Th>
                    <Th>الحالة</Th>
                  </tr>
                </thead>
                <tbody>
                  {todaySchedule.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-orchid-50/40">
                      <Td className="tabular-nums text-muted">{formatArabicTime(appointment.startsAt)}</Td>
                      <Td>
                        <Link href={`/dashboard/patients/${appointment.patient.id}`} className="font-medium hover:text-orchid-600">
                          {appointment.patient.fullName}
                        </Link>
                        <span dir="ltr" className="mr-2 block text-xs text-muted">
                          {appointment.patient.phone}
                        </span>
                      </Td>
                      <Td className="text-muted">{appointment.service?.name ?? '—'}</Td>
                      <Td>
                        <Badge className={appointmentStatusTone[appointment.status]}>
                          {appointmentStatusLabels[appointment.status]}
                        </Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </CardBody>
        </Card>

        {showReports && (
          <Card>
            <CardHeader title="الخدمات الأكثر طلباً" />
            <CardBody>
              <TopServicesChart data={services} />
            </CardBody>
          </Card>
        )}
      </div>

      {showReports && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="حركة المواعيد" description="آخر أربعة عشر يوماً." />
            <CardBody>
              <AppointmentsTrendChart data={trend} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="الإيرادات الشهرية" description="آخر ستة أشهر." />
            <CardBody>
              <RevenueChart data={revenue} />
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
