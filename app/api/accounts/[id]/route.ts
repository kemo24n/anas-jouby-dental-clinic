import { prisma } from '@/lib/db';
import { guard } from '@/lib/guard';
import { accountUpdateSchema } from '@/lib/validation';
import { ERROR_MESSAGES, fail, handleRouteError, ok } from '@/lib/api';
import { hashPassword, tempPassword } from '@/lib/auth/password';
import { audit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

async function findPatientUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, include: { patient: { select: { id: true } } } });
  // هذا المسار لحسابات المرضى فقط — حساب الدكتورة لا يُعدَّل أو يُحذف من هنا
  return user && user.role === 'PATIENT' ? user : null;
}

/** PATCH — إيقاف/تفعيل الحساب، أو إعادة تعيين كلمة المرور (لمن نسيها). */
export async function PATCH(request: Request, props: Params) {
  const { id } = await props.params;
  try {
    const { session, response } = await guard('accounts.write', ['ADMIN']);
    if (response) return response;

    const body = accountUpdateSchema.parse(await request.json());
    const user = await findPatientUser(id);
    if (!user) return fail(ERROR_MESSAGES.notFound, 404);

    let password: string | undefined;
    const data: { isActive?: boolean; passwordHash?: string; mustChangePassword?: boolean; tokenVersion?: { increment: number } } = {};
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.resetPassword) {
      password = tempPassword();
      data.passwordHash = await hashPassword(password);
      data.mustChangePassword = true;
    }
    // أي تغيير هنا يُخرج المريض من كل الأجهزة
    data.tokenVersion = { increment: 1 };

    await prisma.user.update({ where: { id }, data });
    await audit({
      userId: session.sub, action: 'UPDATE', entity: 'User', entityId: id, patientId: user.patient?.id ?? null,
      description: body.resetPassword ? `إعادة تعيين كلمة مرور ${user.fullName}` : `تعديل حالة حساب ${user.fullName}`,
      request,
    });
    return ok({ id, isActive: data.isActive ?? user.isActive, temporaryPassword: password });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** DELETE — حذف حساب البوابة نهائياً. ملف المريض الطبي يبقى في سجلات العيادة. */
export async function DELETE(request: Request, props: Params) {
  const { id } = await props.params;
  try {
    const { session, response } = await guard('accounts.write', ['ADMIN']);
    if (response) return response;

    const user = await findPatientUser(id);
    if (!user) return fail(ERROR_MESSAGES.notFound, 404);

    await prisma.user.delete({ where: { id } });
    await audit({
      userId: session.sub, action: 'DELETE', entity: 'User', entityId: id, patientId: user.patient?.id ?? null,
      description: `حذف حساب ${user.fullName}`, request,
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
