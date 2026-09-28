import { prisma } from '@/lib/db';
import { guard } from '@/lib/guard';
import { caseSchema } from '@/lib/validation';
import { handleRouteError, ok } from '@/lib/api';
import { audit } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const { response } = await guard('cases.read');
    if (response) return response;
    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId') ?? undefined;
    const cases = await prisma.dentalCase.findMany({
      where: { deletedAt: null, ...(patientId ? { patientId } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { patient: { select: { id: true, code: true, fullName: true } } },
    });
    return ok(cases);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { session, response } = await guard('cases.write');
    if (response) return response;

    const body = caseSchema.parse(await request.json());
    const created = await prisma.dentalCase.create({
      data: {
        patientId: body.patientId,
        title: body.title,
        diagnosis: body.diagnosis,
        teeth: body.teeth ?? [],
        description: body.description,
        treatment: body.treatment,
        status: body.status ?? 'OPEN',
        expectedEndDate: body.expectedEndDate ? new Date(body.expectedEndDate) : null,
        notes: body.notes,
      },
    });

    await audit({ userId: session.sub, action: 'CREATE', entity: 'DentalCase', entityId: created.id, patientId: body.patientId, description: `إنشاء حالة: ${created.title}`, request });
    return ok(created, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
