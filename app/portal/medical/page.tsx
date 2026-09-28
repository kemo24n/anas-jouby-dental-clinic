import { requireRole } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/states';
import { genderLabels } from '@/lib/labels';
import { calcAge, formatShortDate } from '@/lib/utils';

export const metadata = { title: 'ملفي الطبي' };
export const dynamic = 'force-dynamic';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-line py-2.5 last:border-0">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-sm">{value || <span className="text-muted">—</span>}</p>
    </div>
  );
}

function Flag({ active, label }: { active: boolean; label: string }) {
  if (!active) return null;
  return <span className="inline-flex items-center rounded-full border border-[#F4CACC] bg-[#FDEEEE] px-2.5 py-1 text-xs text-[#B3363F]">{label}</span>;
}

export default async function PortalMedicalPage() {
  const session = await requireRole('PATIENT');
  if (!session.patientId) return <EmptyState title="لا يوجد ملف مريض مرتبط بحسابك" />;

  const patient = await prisma.patient.findUnique({
    where: { id: session.patientId },
    include: { medicalHistory: true, dentalHistory: true },
  });

  if (!patient) return <EmptyState title="تعذّر العثور على ملفك" />;

  return (
    <div className="animate-rise space-y-6">
      <Card>
        <CardHeader title="المعلومات الشخصية" />
        <CardBody className="grid gap-x-8 py-1 sm:grid-cols-2">
          <Row label="الاسم الكامل" value={patient.fullName} />
          <Row label="رقم المريض" value={patient.code} />
          <Row label="تاريخ الميلاد" value={patient.birthDate ? `${formatShortDate(patient.birthDate)} (${calcAge(patient.birthDate)} سنة)` : null} />
          <Row label="الجنس" value={genderLabels[patient.gender]} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="التاريخ الطبي" />
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Flag active={patient.medicalHistory?.isPregnant ?? false} label="حمل" />
            <Flag active={patient.medicalHistory?.isSmoker ?? false} label="تدخين" />
            <Flag active={patient.medicalHistory?.hasHypertension ?? false} label="ارتفاع ضغط الدم" />
            <Flag active={patient.medicalHistory?.hasDiabetes ?? false} label="السكري" />
            <Flag active={patient.medicalHistory?.hasHeartCondition ?? false} label="أمراض قلبية" />
            <Flag active={patient.medicalHistory?.hasBleedingDisorder ?? false} label="اضطرابات نزفية" />
          </div>
          <Row label="الحساسية" value={patient.medicalHistory?.allergies} />
          <Row label="الأمراض المزمنة" value={patient.medicalHistory?.chronicDiseases} />
          <Row label="الأدوية الحالية" value={patient.medicalHistory?.medications} />
          <Row label="العمليات السابقة" value={patient.medicalHistory?.surgeries} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="التاريخ السني" />
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Flag active={patient.dentalHistory?.gumDisease ?? false} label="أمراض اللثة" />
            <Flag active={patient.dentalHistory?.sensitivity ?? false} label="حساسية الأسنان" />
            <Flag active={patient.dentalHistory?.bruxism ?? false} label="صرير الأسنان" />
          </div>
          <Row label="العلاجات السابقة" value={patient.dentalHistory?.previousTreatments} />
          <Row label="القلع السابق" value={patient.dentalHistory?.previousExtractions} />
          <Row label="علاجات العصب السابقة" value={patient.dentalHistory?.previousRootCanals} />
          <Row label="تاريخ التقويم" value={patient.dentalHistory?.orthodonticHistory} />
        </CardBody>
      </Card>

      <p className="text-xs text-muted">
        هذه المعلومات للاطّلاع فقط. لتحديثها يرجى إخبار الطبيبة خلال زيارتك القادمة.
      </p>
    </div>
  );
}
