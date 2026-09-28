import { requireRole } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/states';
import { TableWrap, Td, Th } from '@/components/dashboard/primitives';
import { BookingWizard } from '@/components/public/booking-wizard';
import { appointmentStatusLabels, appointmentStatusTone } from '@/lib/labels';
import { formatArabicTime, formatShortDate } from '@/lib/utils';
import { PUBLIC_WHATSAPP } from '@/lib/env';

export const metadata = { title: 'مواعيدي' };
export const dynamic = 'force-dynamic';

export default async function PortalAppointmentsPage() {
  const session = await requireRole('PATIENT');

  const [categories, patient] = await Promise.all([
    prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { services: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
    }),
    session.patientId
      ? prisma.patient.findUnique({
          where: { id: session.patientId },
          select: {
            fullName: true,
            phone: true,
            email: true,
            appointments: { orderBy: { startsAt: 'desc' }, include: { service: { select: { name: true } } } },
          },
        })
      : null,
  ]);

  const serialCategories = categories.map((category) => ({
    ...category,
    services: category.services.map((service) => ({ ...service, startingPrice: service.startingPrice ? String(service.startingPrice) : null })),
  }));

  return (
    <div className="animate-rise space-y-8">
      <Card>
        <CardHeader title="حجز موعد جديد" />
        <div className="px-5 py-6">
          <BookingWizard
            categories={serialCategories}
            whatsapp={PUBLIC_WHATSAPP}
            clinicName="عيادة د. أنس جوبي"
            prefill={{ fullName: patient?.fullName, phone: patient?.phone, email: patient?.email ?? undefined }}
          />
        </div>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold">سجل مواعيدي</h2>
        {!patient || patient.appointments.length === 0 ? (
          <EmptyState title="لا توجد مواعيد سابقة" />
        ) : (
          <Card>
            <TableWrap>
              <thead>
                <tr>
                  <Th>التاريخ</Th>
                  <Th>الوقت</Th>
                  <Th>الخدمة</Th>
                  <Th>الحالة</Th>
                </tr>
              </thead>
              <tbody>
                {patient.appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <Td>{formatShortDate(appointment.startsAt)}</Td>
                    <Td className="tabular-nums text-muted">{formatArabicTime(appointment.startsAt)}</Td>
                    <Td className="text-muted">{appointment.service?.name ?? '—'}</Td>
                    <Td>
                      <Badge className={appointmentStatusTone[appointment.status]}>{appointmentStatusLabels[appointment.status]}</Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Card>
        )}
      </div>
    </div>
  );
}
