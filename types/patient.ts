import type {
  AppointmentStatus,
  CaseStatus,
  FileKind,
  Gender,
  PaymentMethod,
  ToothCondition,
  TreatmentItemStatus,
  TreatmentPlanStatus,
} from '@prisma/client';

/** شكل بيانات ملف المريض بعد التحويل إلى JSON (Decimal → number, Date → string). */
export type PatientProfileData = {
  id: string;
  code: string;
  fullName: string;
  phone: string;
  email: string | null;
  birthDate: string | null;
  gender: Gender;
  address: string | null;
  photoUrl: string | null;
  notes: string | null;
  registeredAt: string;

  medicalHistory: {
    allergies: string | null;
    chronicDiseases: string | null;
    medications: string | null;
    surgeries: string | null;
    isPregnant: boolean;
    isSmoker: boolean;
    hasHypertension: boolean;
    hasDiabetes: boolean;
    hasHeartCondition: boolean;
    hasBleedingDisorder: boolean;
    notes: string | null;
  } | null;

  dentalHistory: {
    previousTreatments: string | null;
    previousSurgeries: string | null;
    previousRootCanals: string | null;
    previousExtractions: string | null;
    previousImplants: string | null;
    orthodonticHistory: string | null;
    gumDisease: boolean;
    sensitivity: boolean;
    bruxism: boolean;
    notes: string | null;
  } | null;

  appointments: {
    id: string;
    code: string;
    startsAt: string;
    status: AppointmentStatus;
    reason: string | null;
    serviceName: string | null;
  }[];

  cases: {
    id: string;
    title: string;
    diagnosis: string | null;
    teeth: number[];
    description: string | null;
    treatment: string | null;
    status: CaseStatus;
    startDate: string;
    expectedEndDate: string | null;
    actualEndDate: string | null;
    notes: string | null;
  }[];

  plans: {
    id: string;
    title: string;
    status: TreatmentPlanStatus;
    notes: string | null;
    createdAt: string;
    items: {
      id: string;
      procedure: string;
      toothNumber: number | null;
      estimatedCost: number;
      actualCost: number | null;
      status: TreatmentItemStatus;
      scheduledDate: string | null;
      notes: string | null;
    }[];
  }[];

  notes_clinical: {
    id: string;
    content: string;
    diagnosis: string | null;
    treatment: string | null;
    recommendations: string | null;
    followUpAt: string | null;
    createdAt: string;
    dentistName: string | null;
  }[];

  chartRecords: {
    toothNumber: number;
    condition: ToothCondition;
    notes: string | null;
    recordedAt: string;
  }[];

  payments: {
    id: string;
    amount: number;
    method: PaymentMethod;
    paidAt: string;
    notes: string | null;
  }[];

  files: {
    id: string;
    name: string;
    kind: FileKind;
    mimeType: string;
    sizeBytes: number;
    toothNumber: number | null;
    createdAt: string;
  }[];

  balance: { charged: number; paid: number; balance: number };
};
