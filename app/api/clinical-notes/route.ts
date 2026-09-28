import { prisma } from '@/lib/db';
import { guard } from '@/lib/guard';
import { handleRouteError, ok } from '@/lib/api';

/** GET /api/clinical-notes?patientId= — تغذية عامة بأحدث الملاحظات السريرية عبر كل المرضى. */
export async function GET(request: Request) {
  try {
    const { response } = await guard('clinical.read');
    if (response) return response;

    const patientId = new URL(request.url).searchParams.get('patientId') ?? undefined;

    const notes = await prisma.clinicalNote.findMany({
      where: patientId ? { patientId } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        dentist: { select: { fullName: true } },
        patient: { select: { id: true, code: true, fullName: true } },
      },
    });
    return ok(notes);
  } catch (error) {
    return handleRouteError(error);
  }
}
