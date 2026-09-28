import { prisma } from '@/lib/db';
import { normalizePhone } from '@/lib/utils';

/** توليد رقم مريض متسلسل: P-1001 (يعتمد على أعلى رقم موجود لتجنّب التكرار بعد الحذف) */
export async function nextPatientCode() {
  const last = await prisma.patient.findFirst({
    where: { code: { startsWith: 'P-' } },
    orderBy: { createdAt: 'desc' },
    select: { code: true },
  });
  const count = await prisma.patient.count();
  const lastNum = last ? Number(last.code.slice(2)) || 0 : 0;
  return `P-${Math.max(1001 + count, lastNum + 1)}`;
}

/** يبحث عن مريض بالهاتف وإلا ينشئ سجلاً جديداً — يُستخدم في الحجز العام. */
export async function findOrCreatePatient(input: {
  fullName: string;
  phone: string;
  email?: string;
  birthDate?: string;
  userId?: string;
}) {
  const phone = normalizePhone(input.phone);
  const existing = await prisma.patient.findFirst({ where: { phone, deletedAt: null } });
  if (existing) {
    return existing;
  }
  return createPatientRecord(input);
}

/** إنشاء ملف مريض جديد دائماً (بدون البحث عن ملف موجود). */
export async function createPatientRecord(input: {
  fullName: string;
  phone: string;
  email?: string;
  birthDate?: string;
  userId?: string;
}) {
  const phone = normalizePhone(input.phone);
  return prisma.patient.create({
    data: {
      code: await nextPatientCode(),
      fullName: input.fullName,
      phone,
      email: input.email || null,
      birthDate: input.birthDate ? new Date(input.birthDate) : null,
      userId: input.userId,
      medicalHistory: { create: {} },
      dentalHistory: { create: {} },
    },
  });
}

/** الرصيد المالي: إجمالي العلاجات المعتمدة ناقص المدفوع. */
export async function getPatientBalance(patientId: string) {
  const [items, payments] = await Promise.all([
    prisma.treatmentPlanItem.findMany({
      where: {
        plan: { patientId, deletedAt: null, status: { in: ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] } },
        status: { not: 'REJECTED' },
      },
      select: { estimatedCost: true, actualCost: true },
    }),
    prisma.payment.aggregate({ where: { patientId, deletedAt: null }, _sum: { amount: true } }),
  ]);
  const charged = items.reduce((sum, i) => sum + Number(i.actualCost ?? i.estimatedCost), 0);
  const paid = Number(payments._sum.amount ?? 0);
  return { charged, paid, balance: charged - paid };
}
