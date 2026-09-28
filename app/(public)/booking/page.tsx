import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { BookingWizard } from '@/components/public/booking-wizard';
import { Section } from '@/components/public/section';
import { getClinicSettings } from '@/services/availability.service';
import { getSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'حجز موعد',
  description: 'احجز موعدك في عيادة د. أنس جوبي لطب الأسنان في حلب: اختر الخدمة والتاريخ والوقت المتاح.',
};

export default async function BookingPage() {
  const [categories, settings, session] = await Promise.all([
    prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { services: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
    }),
    getClinicSettings(),
    getSession(),
  ]);

  const patient = session?.patientId
    ? await prisma.patient.findUnique({
        where: { id: session.patientId },
        select: { fullName: true, phone: true, email: true },
      })
    : null;

  const plain = categories.map((category) => ({
    id: category.id,
    name: category.name,
    services: category.services.map((service) => ({
      id: service.id,
      name: service.name,
      durationMin: service.durationMin,
      startingPrice: service.startingPrice ? String(service.startingPrice) : null,
    })),
  }));

  return (
    <Section>
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-semibold sm:text-4xl">حجز موعد</h1>
        <p className="mx-auto mt-4 max-w-lg text-[15px] leading-8 text-muted">
          تظهر الأوقات المتاحة فقط حسب دوام الطبيبة والمواعيد المحجوزة، فلا مجال لحجز وقت غير متاح.
        </p>
      </div>
      <BookingWizard
        categories={plain}
        whatsapp={settings.whatsapp}
        clinicName={settings.clinicName}
        prefill={patient ? { fullName: patient.fullName, phone: patient.phone, email: patient.email ?? '' } : undefined}
      />
    </Section>
  );
}
