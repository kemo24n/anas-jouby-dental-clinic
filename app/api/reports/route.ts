import { prisma } from '@/lib/db';
import { guard } from '@/lib/guard';
import { handleRouteError, ok } from '@/lib/api';
import { appointmentsTrend, dashboardStats, outstandingBalances, revenueByMonth, topServices } from '@/services/reports.service';
import { appointmentStatusLabels } from '@/lib/labels';

/**
 * GET /api/reports?from&to&format=json|csv&type=appointments|payments|patients
 */
export async function GET(request: Request) {
  try {
    const { response } = await guard('reports.read');
    if (response) return response;

    const url = new URL(request.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const type = url.searchParams.get('type') ?? 'summary';
    const format = url.searchParams.get('format') ?? 'json';

    const range = {
      gte: from ? new Date(`${from}T00:00:00`) : new Date(new Date().setMonth(new Date().getMonth() - 1)),
      lte: to ? new Date(`${to}T23:59:59`) : new Date(),
    };

    if (type === 'appointments') {
      const rows = await prisma.appointment.findMany({
        where: { startsAt: range },
        orderBy: { startsAt: 'asc' },
        include: { patient: { select: { code: true, fullName: true, phone: true } }, service: { select: { name: true } } },
      });
      if (format === 'csv') {
        const header = ['رقم الموعد', 'التاريخ', 'الوقت', 'المريض', 'الهاتف', 'الخدمة', 'الحالة'];
        const lines = rows.map((r) => [
          r.code,
          r.startsAt.toISOString().slice(0, 10),
          r.startsAt.toISOString().slice(11, 16),
          r.patient.fullName,
          r.patient.phone,
          r.service?.name ?? '-',
          appointmentStatusLabels[r.status],
        ]);
        return csv([header, ...lines], 'appointments');
      }
      return ok(rows);
    }

    if (type === 'payments') {
      const rows = await prisma.payment.findMany({
        where: { paidAt: range, deletedAt: null },
        orderBy: { paidAt: 'asc' },
        include: { patient: { select: { code: true, fullName: true } } },
      });
      if (format === 'csv') {
        const header = ['التاريخ', 'المريض', 'رقم المريض', 'المبلغ', 'الطريقة', 'ملاحظات'];
        const lines = rows.map((r) => [
          r.paidAt.toISOString().slice(0, 10),
          r.patient.fullName,
          r.patient.code,
          String(Number(r.amount)),
          r.method,
          r.notes ?? '',
        ]);
        return csv([header, ...lines], 'payments');
      }
      return ok(rows);
    }

    const [stats, trend, revenue, services, balances] = await Promise.all([
      dashboardStats(), appointmentsTrend(), revenueByMonth(), topServices(), outstandingBalances(),
    ]);
    return ok({ stats, trend, revenue, services, balances });
  } catch (error) {
    return handleRouteError(error);
  }
}

function csv(rows: string[][], name: string) {
  const body = rows
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  // BOM حتى تفتح إكسل الملف بالعربية بشكل صحيح
  return new Response('\uFEFF' + body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
