import type {
  AppointmentStatus, CaseStatus, ContactStatus, FileKind, Gender,
  PaymentMethod, Role, ToothCondition, TreatmentItemStatus, TreatmentPlanStatus,
} from '@prisma/client';

export const roleLabels: Record<Role, string> = {
  ADMIN: 'الطبيبة — إدارة العيادة',
  DENTIST: 'طبيبة الأسنان',
  RECEPTIONIST: 'موظفة الاستقبال',
  PATIENT: 'مريض',
};

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  BOOKED: 'محجوز',
  CONFIRMED: 'مؤكد',
  ARRIVED: 'حضر',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغى',
  NO_SHOW: 'لم يحضر',
  RESCHEDULED: 'معاد جدولته',
};

export const appointmentStatusTone: Record<AppointmentStatus, string> = {
  BOOKED: 'bg-orchid-100 text-orchid-700 border-orchid-200',
  CONFIRMED: 'bg-rose-100 text-rose-700 border-rose-200',
  ARRIVED: 'bg-champagne-100 text-champagne-600 border-champagne-200',
  COMPLETED: 'bg-[#E8F3EC] text-[#417A5C] border-[#CDE6D8]',
  CANCELLED: 'bg-[#FBEDF0] text-[#A94B5A] border-[#F2D5DB]',
  NO_SHOW: 'bg-[#F4F1F6] text-muted border-line',
  RESCHEDULED: 'bg-[#FDF3E3] text-[#8D7140] border-[#EDDFC2]',
};

export const caseStatusLabels: Record<CaseStatus, string> = {
  OPEN: 'مفتوحة',
  IN_TREATMENT: 'قيد العلاج',
  COMPLETED: 'مكتملة',
  ON_HOLD: 'متوقفة',
};

export const planStatusLabels: Record<TreatmentPlanStatus, string> = {
  PROPOSED: 'مقترح',
  APPROVED: 'موافق عليه',
  IN_PROGRESS: 'قيد التنفيذ',
  COMPLETED: 'مكتمل',
  REJECTED: 'مرفوض',
};

export const itemStatusLabels: Record<TreatmentItemStatus, string> = {
  PROPOSED: 'مقترح',
  APPROVED: 'موافق عليه',
  IN_PROGRESS: 'قيد التنفيذ',
  COMPLETED: 'مكتمل',
  REJECTED: 'مرفوض',
};

export const toothConditionLabels: Record<ToothCondition, string> = {
  HEALTHY: 'سليم',
  CARIES: 'تسوس',
  FILLING: 'حشوة',
  CROWN: 'تاج',
  MISSING: 'مفقود',
  EXTRACTED: 'مخلوع',
  ROOT_CANAL: 'علاج عصب',
  IMPLANT: 'زراعة',
  FRACTURE: 'كسر',
  OTHER: 'أخرى',
};

/** ألوان مخطط الأسنان — كل حالة تُميَّز بصرياً بلون وحد واضح */
export const toothConditionColors: Record<ToothCondition, { fill: string; stroke: string; text: string }> = {
  HEALTHY: { fill: '#FFFFFF', stroke: '#DCD2E4', text: '#29242D' },
  CARIES: { fill: '#F6DCC9', stroke: '#C98A5E', text: '#7A4A26' },
  FILLING: { fill: '#DCE7F3', stroke: '#7E9CC0', text: '#2F4A66' },
  CROWN: { fill: '#F2E3C0', stroke: '#C9A86A', text: '#7A6130' },
  MISSING: { fill: '#F1EDF4', stroke: '#CBC2D2', text: '#8B8194' },
  EXTRACTED: { fill: '#EDE7F1', stroke: '#B3A6BF', text: '#6B6073' },
  ROOT_CANAL: { fill: '#E7DCF3', stroke: '#8B6BB1', text: '#54397A' },
  IMPLANT: { fill: '#DCEFE6', stroke: '#6FAF8A', text: '#356050' },
  FRACTURE: { fill: '#F8DDE2', stroke: '#C96C7A', text: '#8A3C49' },
  OTHER: { fill: '#F5F2F7', stroke: '#B9AEC4', text: '#5B5265' },
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: 'نقداً',
  CARD: 'بطاقة',
  TRANSFER: 'تحويل بنكي',
  OTHER: 'أخرى',
};

export const fileKindLabels: Record<FileKind, string> = {
  BEFORE: 'صورة قبل',
  AFTER: 'صورة بعد',
  XRAY: 'صورة أشعة',
  CLINICAL: 'صورة سريرية',
  DOCUMENT: 'مستند',
};

export const genderLabels: Record<Gender, string> = {
  FEMALE: 'أنثى',
  MALE: 'ذكر',
  UNSPECIFIED: 'غير محدد',
};

export const contactStatusLabels: Record<ContactStatus, string> = {
  NEW: 'جديد',
  IN_PROGRESS: 'قيد المتابعة',
  ANSWERED: 'تم الرد',
  CLOSED: 'مغلق',
};

export const weekdayLabels = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
