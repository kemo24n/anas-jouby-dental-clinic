import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { can } from '@/lib/permissions';
import { getPatientBalance } from '@/services/patients.service';
import { PatientProfile } from '@/components/dashboard/patient-profile';
import type { PatientProfileData } from '@/types/patient';

export const metadata = { title: 'ملف المريض' };
export const dynamic = 'force-dynamic';

export default async function PatientProfilePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await requireRole('ADMIN', 'DENTIST', 'RECEPTIONIST');
  const clinical = can(session.role, 'clinical.read');

  const patient = await prisma.patient.findFirst({
    where: { id: params.id, deletedAt: null },
    include: {
      medicalHistory: clinical,
      dentalHistory: clinical,
      appointments: { orderBy: { startsAt: 'desc' }, include: { service: { select: { name: true } } } },
      cases: clinical ? { where: { deletedAt: null }, orderBy: { startDate: 'desc' } } : false,
      treatmentPlans: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      },
      clinicalNotes: clinical
        ? { orderBy: { createdAt: 'desc' }, include: { dentist: { select: { fullName: true } } } }
        : false,
      chartRecords: clinical ? { orderBy: { toothNumber: 'asc' } } : false,
      payments: { where: { deletedAt: null }, orderBy: { paidAt: 'desc' } },
      files: clinical ? { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } } : false,
    },
  });

  if (!patient) notFound();

  const balance = await getPatientBalance(patient.id);

  const data: PatientProfileData = {
    id: patient.id,
    code: patient.code,
    fullName: patient.fullName,
    phone: patient.phone,
    email: patient.email,
    birthDate: patient.birthDate?.toISOString() ?? null,
    gender: patient.gender,
    address: patient.address,
    photoUrl: patient.photoUrl,
    notes: patient.notes,
    registeredAt: patient.registeredAt.toISOString(),

    medicalHistory: patient.medicalHistory
      ? {
          allergies: patient.medicalHistory.allergies,
          chronicDiseases: patient.medicalHistory.chronicDiseases,
          medications: patient.medicalHistory.medications,
          surgeries: patient.medicalHistory.surgeries,
          isPregnant: patient.medicalHistory.isPregnant,
          isSmoker: patient.medicalHistory.isSmoker,
          hasHypertension: patient.medicalHistory.hasHypertension,
          hasDiabetes: patient.medicalHistory.hasDiabetes,
          hasHeartCondition: patient.medicalHistory.hasHeartCondition,
          hasBleedingDisorder: patient.medicalHistory.hasBleedingDisorder,
          notes: patient.medicalHistory.notes,
        }
      : null,

    dentalHistory: patient.dentalHistory
      ? {
          previousTreatments: patient.dentalHistory.previousTreatments,
          previousSurgeries: patient.dentalHistory.previousSurgeries,
          previousRootCanals: patient.dentalHistory.previousRootCanals,
          previousExtractions: patient.dentalHistory.previousExtractions,
          previousImplants: patient.dentalHistory.previousImplants,
          orthodonticHistory: patient.dentalHistory.orthodonticHistory,
          gumDisease: patient.dentalHistory.gumDisease,
          sensitivity: patient.dentalHistory.sensitivity,
          bruxism: patient.dentalHistory.bruxism,
          notes: patient.dentalHistory.notes,
        }
      : null,

    appointments: patient.appointments.map((appointment) => ({
      id: appointment.id,
      code: appointment.code,
      startsAt: appointment.startsAt.toISOString(),
      status: appointment.status,
      reason: appointment.reason,
      serviceName: appointment.service?.name ?? null,
    })),

    cases: (patient.cases ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      diagnosis: item.diagnosis,
      teeth: item.teeth,
      description: item.description,
      treatment: item.treatment,
      status: item.status,
      startDate: item.startDate.toISOString(),
      expectedEndDate: item.expectedEndDate?.toISOString() ?? null,
      actualEndDate: item.actualEndDate?.toISOString() ?? null,
      notes: item.notes,
    })),

    plans: patient.treatmentPlans.map((plan) => ({
      id: plan.id,
      title: plan.title,
      status: plan.status,
      notes: plan.notes,
      createdAt: plan.createdAt.toISOString(),
      items: plan.items.map((item) => ({
        id: item.id,
        procedure: item.procedure,
        toothNumber: item.toothNumber,
        estimatedCost: Number(item.estimatedCost),
        actualCost: item.actualCost === null ? null : Number(item.actualCost),
        status: item.status,
        scheduledDate: item.scheduledDate?.toISOString() ?? null,
        notes: item.notes,
      })),
    })),

    notes_clinical: (patient.clinicalNotes ?? []).map((note) => ({
      id: note.id,
      content: note.content,
      diagnosis: note.diagnosis,
      treatment: note.treatment,
      recommendations: note.recommendations,
      followUpAt: note.followUpAt?.toISOString() ?? null,
      createdAt: note.createdAt.toISOString(),
      dentistName: (note as typeof note & { dentist?: { fullName: string } | null }).dentist?.fullName ?? null,
    })),

    chartRecords: (patient.chartRecords ?? []).map((record) => ({
      toothNumber: record.toothNumber,
      condition: record.condition,
      notes: record.notes,
      recordedAt: record.recordedAt.toISOString(),
    })),

    payments: patient.payments.map((payment) => ({
      id: payment.id,
      amount: Number(payment.amount),
      method: payment.method,
      paidAt: payment.paidAt.toISOString(),
      notes: payment.notes,
    })),

    files: (patient.files ?? []).map((file) => ({
      id: file.id,
      name: file.name,
      kind: file.kind,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      toothNumber: file.toothNumber,
      createdAt: file.createdAt.toISOString(),
    })),

    balance,
  };

  return (
    <PatientProfile
      patient={data}
      permissions={{
        clinicalRead: clinical,
        clinicalWrite: can(session.role, 'clinical.write'),
        patientsWrite: can(session.role, 'patients.write'),
        casesWrite: can(session.role, 'cases.write'),
        plansWrite: can(session.role, 'plans.write'),
        paymentsWrite: can(session.role, 'payments.write'),
        filesWrite: can(session.role, 'files.write'),
        patientsDelete: can(session.role, 'patients.delete'),
      }}
    />
  );
}
