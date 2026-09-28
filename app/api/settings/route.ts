import { prisma } from '@/lib/db';
import { guard } from '@/lib/guard';
import { settingsSchema } from '@/lib/validation';
import { handleRouteError, ok } from '@/lib/api';
import { getClinicSettings } from '@/services/availability.service';
import { audit } from '@/lib/audit';

export async function GET() {
  try {
    const settings = await getClinicSettings();
    // بيانات العيادة العامة — لا تحتوي أسراراً
    return ok(settings);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { session, response } = await guard('settings.write', ['ADMIN']);
    if (response) return response;

    const body = settingsSchema.parse(await request.json());
    const settings = await prisma.clinicSettings.upsert({
      where: { id: 'singleton' },
      update: body,
      create: { id: 'singleton', ...body },
    });

    await audit({ userId: session.sub, action: 'UPDATE', entity: 'ClinicSettings', entityId: 'singleton', description: 'تعديل إعدادات العيادة', request });
    return ok(settings);
  } catch (error) {
    return handleRouteError(error);
  }
}
