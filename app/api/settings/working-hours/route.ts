import { prisma } from '@/lib/db';
import { guard } from '@/lib/guard';
import { workingHoursSchema } from '@/lib/validation';
import { handleRouteError, ok } from '@/lib/api';
import { getPrimaryDentist } from '@/services/availability.service';
import { audit } from '@/lib/audit';

export async function GET() {
  try {
    const dentist = await getPrimaryDentist();
    const hours = await prisma.workingHour.findMany({ where: { dentistId: dentist.id }, orderBy: { weekday: 'asc' } });
    return ok(hours);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const { session, response } = await guard('settings.write', ['ADMIN', 'DENTIST']);
    if (response) return response;

    const body = workingHoursSchema.parse(await request.json());
    const dentist = await getPrimaryDentist();

    await prisma.$transaction(
      body.map((h) =>
        prisma.workingHour.upsert({
          where: { dentistId_weekday: { dentistId: dentist.id, weekday: h.weekday } },
          update: {
            startTime: h.startTime,
            endTime: h.endTime,
            breakStart: h.breakStart || null,
            breakEnd: h.breakEnd || null,
            isClosed: h.isClosed,
          },
          create: {
            dentistId: dentist.id,
            weekday: h.weekday,
            startTime: h.startTime,
            endTime: h.endTime,
            breakStart: h.breakStart || null,
            breakEnd: h.breakEnd || null,
            isClosed: h.isClosed,
          },
        }),
      ),
    );

    await audit({ userId: session.sub, action: 'UPDATE', entity: 'WorkingHour', description: 'تعديل ساعات الدوام', request });
    return ok({ saved: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
