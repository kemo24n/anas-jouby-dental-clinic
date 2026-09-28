import Link from 'next/link';
import { CalendarPlus, MessageCircle } from 'lucide-react';
import { requireRole } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { getPatientBalance } from '@/services/patients.service';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/states';
import { appointmentStatusLabels, appointmentStatusTone } from '@/lib/labels';
import { formatArabicDate, formatArabicTime, formatMoney } from '@/lib/utils';
import { WA_MESSAGES, whatsappLink } from '@/lib/whatsapp';
import { PUBLIC_WHATSAPP } from '@/lib/env';

export const metadata = { title: 'الرئيسية' };
export const dynamic = 'force-dynamic';

export default async function PortalHome() {
  const session = await requireRole('PATIENT');
  if (!session.patientId) {
    return <EmptyState title="لا يوجد ملف مريض مرتبط بحسابك" description="يرجى التواصل مع العيادة." />;
  }

  const [patient, balance] = await Promise.all([
    prisma.patient.findUnique({
      where: { id: session.patientId },
      include: {
        appointments: { orderBy: { startsAt: 'asc' }, include: { service: { select: { name: true } } } },
      },
    }),
    getPatientBalance(session.patientId),
  ]);

  if (!patient) return <EmptyState title="تعذّر العثور على ملفك" />;

  const now = Date.now();
  const upcoming = patient.appointments.filter(
    (a) => new Date(a.startsAt).getTime() > now && !['CANCELLED', 'NO_SHOW'].includes(a.status),
  );
  const next = upcoming[0];

  return (
    <div className="animate-rise space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader title="موعدك القادم" />
          <CardBody>
            {next ? (
              <div className="space-y-2">
                <p className="text-lg font-semibold">{formatArabicDate(next.startsAt)}</p>
                <p className="tabular-nums text-muted">{formatArabicTime(next.startsAt)}</p>
                {next.service?.name && <p className="text-sm text-muted">{next.service.name}</p>}
                <Badge className={appointmentStatusTone[next.status]}>{appointmentStatusLabels[next.status]}</Badge>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted">لا يوجد موعد قادم مسجّل.</p>
                <Link href="/portal/appointments" className="inline-flex items-center gap-1.5 text-sm font-medium text-orchid-600 hover:underline">
                  <CalendarPlus size={16} />
                  حجز موعد جديد
                </Link>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="الوضع المالي" />
          <CardBody className="space-y-2 text-sm">
            <p>
              <span className="text-muted">إجمالي العلاجات: </span>
              {formatMoney(balance.charged)}
            </p>
            <p>
              <span className="text-muted">المدفوع: </span>
              {formatMoney(balance.paid)}
            </p>
            <p>
              <span className="text-muted">الرصيد المتبقي: </span>
              <b className={balance.balance > 0 ? 'text-danger' : undefined}>{formatMoney(balance.balance)}</b>
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="تحتاج مساعدة؟" description="راسلنا مباشرة عبر واتساب لأي استفسار أو تعديل موعد." />
        <CardBody>
          <a
            href={whatsappLink(WA_MESSAGES.general, PUBLIC_WHATSAPP)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-ok px-5 text-sm font-medium text-white hover:brightness-95"
          >
            <MessageCircle size={17} />
            مراسلة العيادة عبر واتساب
          </a>
        </CardBody>
      </Card>
    </div>
  );
}
