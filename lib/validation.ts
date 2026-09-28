import { z } from 'zod';
import { isValidPhone, normalizePhone, normalizeSyrianMobile } from './utils';
import { ERROR_MESSAGES } from './api';

const phone = z
  .string()
  .min(6, ERROR_MESSAGES.invalidPhone)
  .refine(isValidPhone, ERROR_MESSAGES.invalidPhone)
  .transform(normalizePhone);

/** رقم الموبايل المستخدم للدخول: 09XXXXXXXX */
export const MOBILE_ERROR = 'يرجى إدخال رقم موبايل صحيح مثل 0944123456.';
const mobile = z
  .string({ required_error: MOBILE_ERROR })
  .refine((v) => normalizeSyrianMobile(v) !== null, MOBILE_ERROR)
  .transform((v) => normalizeSyrianMobile(v) as string);

const optionalPhone = z
  .string()
  .optional()
  .transform((v) => (v ? normalizePhone(v) : undefined));

export const loginSchema = z.object({
  phone: mobile,
  password: z.string().min(1, 'يرجى إدخال كلمة المرور.').max(200),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(3, 'يرجى إدخال الاسم الكامل.').max(120),
  phone: mobile,
  email: z.string().trim().email('يرجى إدخال بريد إلكتروني صحيح.').optional().or(z.literal('')),
  password: z.string().min(8, 'يجب ألا تقل كلمة المرور عن 8 أحرف.').max(200),
  birthDate: z.string().optional(),
});

export const patientSchema = z.object({
  fullName: z.string().min(3, 'يرجى إدخال الاسم الكامل.'),
  phone,
  email: z.string().email('بريد إلكتروني غير صحيح.').optional().or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
  gender: z.enum(['FEMALE', 'MALE', 'UNSPECIFIED']).default('UNSPECIFIED'),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const medicalHistorySchema = z.object({
  allergies: z.string().optional(),
  chronicDiseases: z.string().optional(),
  medications: z.string().optional(),
  surgeries: z.string().optional(),
  isPregnant: z.boolean().optional(),
  isSmoker: z.boolean().optional(),
  hasHypertension: z.boolean().optional(),
  hasDiabetes: z.boolean().optional(),
  hasHeartCondition: z.boolean().optional(),
  hasBleedingDisorder: z.boolean().optional(),
  notes: z.string().optional(),
});

export const dentalHistorySchema = z.object({
  previousTreatments: z.string().optional(),
  previousSurgeries: z.string().optional(),
  previousRootCanals: z.string().optional(),
  previousExtractions: z.string().optional(),
  previousImplants: z.string().optional(),
  orthodonticHistory: z.string().optional(),
  gumDisease: z.boolean().optional(),
  sensitivity: z.boolean().optional(),
  bruxism: z.boolean().optional(),
  notes: z.string().optional(),
});

/** الحجز العام من الموقع — يقبل مريضاً جديداً أو حالياً. */
export const publicBookingSchema = z.object({
  fullName: z.string().min(3, 'يرجى إدخال الاسم الكامل.'),
  phone,
  email: z.string().email('بريد إلكتروني غير صحيح.').optional().or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
  serviceId: z.string().uuid('يرجى اختيار الخدمة.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'يرجى اختيار التاريخ.'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'يرجى اختيار الوقت.'),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export const appointmentCreateSchema = z.object({
  patientId: z.string().uuid(),
  serviceId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  durationMin: z.number().int().min(10).max(480).optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export const appointmentUpdateSchema = z.object({
  status: z.enum(['BOOKED', 'CONFIRMED', 'ARRIVED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED']).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  notes: z.string().optional(),
  cancelReason: z.string().optional(),
});

export const clinicalNoteSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  content: z.string().min(3, 'يرجى كتابة نص الملاحظة.'),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  recommendations: z.string().optional(),
  followUpAt: z.string().optional(),
  visibleToPatient: z.boolean().optional(),
});

export const caseSchema = z.object({
  patientId: z.string().uuid(),
  title: z.string().min(3, 'يرجى إدخال اسم الحالة.'),
  diagnosis: z.string().optional(),
  teeth: z.array(z.number().int()).optional(),
  description: z.string().optional(),
  treatment: z.string().optional(),
  status: z.enum(['OPEN', 'IN_TREATMENT', 'COMPLETED', 'ON_HOLD']).optional(),
  expectedEndDate: z.string().optional(),
  notes: z.string().optional(),
});

export const treatmentPlanSchema = z.object({
  patientId: z.string().uuid(),
  caseId: z.string().uuid().optional(),
  title: z.string().min(3, 'يرجى إدخال اسم خطة العلاج.'),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        procedure: z.string().min(2, 'يرجى إدخال الإجراء.'),
        toothNumber: z.number().int().optional(),
        estimatedCost: z.number().min(0).default(0),
        notes: z.string().optional(),
      }),
    )
    .min(1, 'يرجى إضافة إجراء واحد على الأقل.'),
});

export const planUpdateSchema = z.object({
  status: z.enum(['PROPOSED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']).optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
});

export const planItemUpdateSchema = z.object({
  status: z.enum(['PROPOSED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']).optional(),
  actualCost: z.number().min(0).optional(),
  scheduledDate: z.string().optional(),
  notes: z.string().optional(),
});

export const chartRecordSchema = z.object({
  patientId: z.string().uuid(),
  toothNumber: z.number().int().min(11).max(48),
  condition: z.enum([
    'HEALTHY', 'CARIES', 'FILLING', 'CROWN', 'MISSING',
    'EXTRACTED', 'ROOT_CANAL', 'IMPLANT', 'FRACTURE', 'OTHER',
  ]),
  notes: z.string().optional(),
});

export const paymentSchema = z.object({
  patientId: z.string().uuid(),
  amount: z.number().positive('يرجى إدخال مبلغ صحيح.'),
  method: z.enum(['CASH', 'CARD', 'TRANSFER', 'OTHER']).default('CASH'),
  appointmentId: z.string().uuid().optional(),
  treatmentPlanId: z.string().uuid().optional(),
  paidAt: z.string().optional(),
  notes: z.string().optional(),
});

export const serviceSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(2),
  description: z.string().optional(),
  durationMin: z.number().int().min(10).max(480),
  startingPrice: z.number().min(0).nullable().optional(),
  imageUrl: z.string().regex(/^\/images\/[\w\-./]+\.(jpg|jpeg|png|webp)$/i, 'مسار الصورة يجب أن يكون محلياً، مثل /images/services/veneers.jpg').refine((v) => !v.includes('..'), 'مسار غير صالح.').optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2, 'يرجى إدخال الاسم.'),
  phone,
  email: z.string().email('بريد إلكتروني غير صحيح.').optional().or(z.literal('')),
  subject: z.string().optional(),
  message: z.string().min(5, 'يرجى كتابة رسالتك.'),
});

// روابط خارجية: http/https فقط (يمنع javascript: وما شابه)
const httpUrl = z
  .string()
  .trim()
  .refine((v) => v === '' || /^https?:\/\/[^\s]+$/i.test(v), 'يرجى إدخال رابط يبدأ بـ https://')
  .optional();

export const settingsSchema = z.object({
  clinicName: z.string().min(2).optional(),
  dentistName: z.string().min(2).optional(),
  tagline: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: optionalPhone,
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  mapUrl: httpUrl,
  instagram: httpUrl,
  facebook: httpUrl,
  tiktok: httpUrl,
  youtube: httpUrl,
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  slotMinutes: z.number().int().min(5).max(120).optional(),
  bufferMinutes: z.number().int().min(0).max(60).optional(),
  cancellationPolicy: z.string().optional(),
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
});

export const accountCreateSchema = z.object({
  patientId: z.string().uuid('يرجى اختيار المريض.'),
});

export const accountUpdateSchema = z.object({
  isActive: z.boolean().optional(),
  resetPassword: z.boolean().optional(),
});

export const workingHoursSchema = z.array(
  z.object({
    weekday: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    breakStart: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),
    breakEnd: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),
    isClosed: z.boolean(),
  }),
);
