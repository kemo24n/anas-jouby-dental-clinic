'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, MessageCircle, Phone } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Odontogram } from '@/components/dashboard/odontogram';
import {
  AppointmentsPanel,
  CasesPanel,
  DentalHistoryPanel,
  FilesPanel,
  MedicalHistoryPanel,
  NotesPanel,
  OverviewPanel,
  PaymentsPanel,
  PersonalInfoPanel,
  PlansPanel,
} from '@/components/dashboard/patient-panels';
import { calcAge, cn, displayLocalPhone, formatMoney, formatShortDate, initials } from '@/lib/utils';
import { DeleteButton } from '@/components/dashboard/delete-button';
import { useRouter } from 'next/navigation';
import { genderLabels } from '@/lib/labels';
import { WA_MESSAGES, whatsappLink } from '@/lib/whatsapp';
import type { PatientProfileData } from '@/types/patient';

export type ProfilePermissions = {
  clinicalRead: boolean;
  clinicalWrite: boolean;
  patientsWrite: boolean;
  casesWrite: boolean;
  plansWrite: boolean;
  paymentsWrite: boolean;
  filesWrite: boolean;
  patientsDelete?: boolean;
};

type TabKey =
  | 'overview'
  | 'personal'
  | 'medical'
  | 'dental'
  | 'chart'
  | 'appointments'
  | 'cases'
  | 'plans'
  | 'notes'
  | 'payments'
  | 'files'
  | 'images';

export function PatientProfile({
  patient,
  permissions,
}: {
  patient: PatientProfileData;
  permissions: ProfilePermissions;
}) {
  const [tab, setTab] = React.useState<TabKey>('overview');
  const router = useRouter();

  const allTabs: { key: TabKey; label: string; clinical?: boolean }[] = [
    { key: 'overview', label: 'نظرة عامة' },
    { key: 'personal', label: 'المعلومات الشخصية' },
    { key: 'medical', label: 'التاريخ الطبي', clinical: true },
    { key: 'dental', label: 'التاريخ السني', clinical: true },
    { key: 'chart', label: 'مخطط الأسنان', clinical: true },
    { key: 'appointments', label: 'المواعيد' },
    { key: 'cases', label: 'الحالات', clinical: true },
    { key: 'plans', label: 'خطط العلاج' },
    { key: 'notes', label: 'الملاحظات', clinical: true },
    { key: 'payments', label: 'المدفوعات' },
    { key: 'files', label: 'الملفات', clinical: true },
    { key: 'images', label: 'الأشعة والصور', clinical: true },
  ];
  const tabs = allTabs.filter((item) => !item.clinical || permissions.clinicalRead);

  return (
    <div className="animate-rise space-y-6">
      <Link href="/dashboard/patients" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-orchid-600">
        <ArrowRight size={16} />
        العودة إلى قائمة المرضى
      </Link>

      {/* بطاقة رأس الملف */}
      <Card>
        <CardBody className="flex flex-wrap items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-bl from-orchid-400 to-rose-400 text-xl font-semibold text-white">
            {initials(patient.fullName)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold">{patient.fullName}</h1>
              <Badge className="border-orchid-200 bg-orchid-50 text-orchid-700">{patient.code}</Badge>
              {patient.balance.balance > 0 && (
                <Badge className="border-[#F4CACC] bg-[#FDEEEE] text-[#B3363F]">
                  رصيد مستحق: {formatMoney(patient.balance.balance)}
                </Badge>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-muted">
              <span dir="ltr">{displayLocalPhone(patient.phone)}</span>
              {patient.email && <span>{patient.email}</span>}
              {patient.birthDate && <span>{calcAge(patient.birthDate)} سنة</span>}
              <span>{genderLabels[patient.gender]}</span>
              {patient.address && <span>{patient.address}</span>}
              <span>مسجّل منذ {formatShortDate(patient.registeredAt)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <a
              href={`tel:+${patient.phone.replace(/[^\d]/g, '')}`}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line px-4 text-sm hover:bg-orchid-50"
            >
              <Phone size={16} />
              اتصال
            </a>
            <a
              href={whatsappLink(WA_MESSAGES.contactPatient(), patient.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-ok px-4 text-sm font-medium text-white hover:brightness-95"
            >
              <MessageCircle size={16} />
              واتساب
            </a>
            {permissions.patientsDelete && (
              <DeleteButton
                endpoint={`/api/patients/${patient.id}`}
                title="حذف المريض نهائياً"
                message={`سيُحذف ملف ${patient.fullName} بالكامل: التاريخ الطبي، المواعيد، المدفوعات، خطط العلاج، الملفات والأشعة، وحساب البوابة إن وجد. لا يمكن التراجع.`}
                onDeleted={() => router.push('/dashboard/patients')}
                label="حذف"
                className="h-10 border border-line px-3"
              />
            )}
          </div>
        </CardBody>
      </Card>

      {/* التبويبات */}
      <div className="table-scroll">
        <div role="tablist" className="flex min-w-max gap-1 border-b border-line">
          {tabs.map((item) => (
            <button
              key={item.key}
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => setTab(item.key)}
              className={cn(
                '-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors',
                tab === item.key
                  ? 'border-orchid-500 font-medium text-orchid-700'
                  : 'border-transparent text-muted hover:text-ink',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        {tab === 'overview' && <OverviewPanel patient={patient} clinical={permissions.clinicalRead} />}
        {tab === 'personal' && <PersonalInfoPanel patient={patient} canEdit={permissions.patientsWrite} />}
        {tab === 'medical' && <MedicalHistoryPanel patient={patient} canEdit={permissions.clinicalWrite} />}
        {tab === 'dental' && <DentalHistoryPanel patient={patient} canEdit={permissions.clinicalWrite} />}
        {tab === 'chart' && (
          <Card>
            <CardHeader
              title="مخطط الأسنان"
              description="انقري على أي سن لتسجيل حالته وإضافة ملاحظة خاصة به. الترقيم عالمي (FDI)."
            />
            <CardBody>
              <Odontogram patientId={patient.id} initial={patient.chartRecords} canEdit={permissions.clinicalWrite} />
            </CardBody>
          </Card>
        )}
        {tab === 'appointments' && <AppointmentsPanel patient={patient} />}
        {tab === 'cases' && <CasesPanel patient={patient} canWrite={permissions.casesWrite} />}
        {tab === 'plans' && <PlansPanel patient={patient} canWrite={permissions.plansWrite} />}
        {tab === 'notes' && <NotesPanel patient={patient} canWrite={permissions.clinicalWrite} />}
        {tab === 'payments' && <PaymentsPanel patient={patient} canWrite={permissions.paymentsWrite} />}
        {tab === 'files' && <FilesPanel patient={patient} canWrite={permissions.filesWrite} />}
        {tab === 'images' && <FilesPanel patient={patient} canWrite={permissions.filesWrite} imagesOnly />}
      </div>
    </div>
  );
}
