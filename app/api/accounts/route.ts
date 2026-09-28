import { prisma } from '@/lib/db';
import { guard } from '@/lib/guard';
import { accountCreateSchema } from '@/lib/validation';
import { ERROR_MESSAGES, fail, handleRouteError, ok } from '@/lib/api';
import { hashPassword, tempPassword } from '@/lib/auth/password';
import { normalizeSyrianMobile } from '@/lib/utils';
import { audit } from '@/lib/audit';

/** GET — كل حسابات المرضى (الدكتورة فقط). */
export async function GET() {
  try {
    const { response } = await guard('accounts.write', ['ADMIN']);
    if (response) return response;

    const users = await prisma.user.findMany({
      where: { role: 'PATIENT' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, fullName: true, phone: true, email: true, isActive: true, lastLoginAt: true, createdAt: true,
        patient: { select: { id: true, code: true, deletedAt: true } },
      },
    });
    return ok(users);
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * POST — إنشاء حساب بوابة لمريض موجود في سجلات العيادة.
 * الدكتورة تتحقق من هوية المريض بنفسها، لذلك الربط هنا آمن (بخلاف التسجيل الذاتي).
 */
export async function POST(request: Request) {
  try {
    const { session, response } = await guard('accounts.write', ['ADMIN']);
    if (response) return response;

    const body = accountCreateSchema.parse(await request.json());
    const patient = await prisma.patient.findFirst({ where: { id: body.patientId, deletedAt: null } });
    if (!patient) return fail(ERROR_MESSAGES.notFound, 404);
    if (patient.userId) return fail('هذا المريض لديه حساب بالفعل.', 409);

    const phone = normalizeSyrianMobile(patient.phone);
    if (!phone) return fail('رقم هاتف المريض ليس رقم موبايل سورياً صحيحاً (09XXXXXXXX). عدّله من ملف المريض أولاً.', 422);
    if (await prisma.user.findUnique({ where: { phone } })) {
      return fail('يوجد حساب آخر بهذا الرقم. احذفه أولاً من قائمة الحسابات إن كان مكرراً.', 409);
    }

    const password = tempPassword();
    const user = await prisma.user.create({
      data: {
        phone,
        email: patient.email,
        fullName: patient.fullName,
        role: 'PATIENT',
        passwordHash: await hashPassword(password),
        mustChangePassword: true,
        patient: { connect: { id: patient.id } },
      },
    });

    await audit({
      userId: session.sub, action: 'CREATE', entity: 'User', entityId: user.id, patientId: patient.id,
      description: `إنشاء حساب بوابة للمريض ${patient.code}`, request,
    });
    return ok({ id: user.id, phone: `0${phone.slice(3)}`, temporaryPassword: password }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
