import { prisma } from '@/lib/db';
import { guard } from '@/lib/guard';
import { patientSchema } from '@/lib/validation';
import { handleRouteError, ok } from '@/lib/api';
import { nextPatientCode } from '@/services/patients.service';
import { audit } from '@/lib/audit';

/** GET /api/patients?q=&page=&pageSize= — بحث وترقيم صفحات. */
export async function GET(request: Request) {
  try {
    const { session, response } = await guard('patients.read');
    if (response) return response;

    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim() ?? '';
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
    const pageSize = Math.min(50, Math.max(5, Number(url.searchParams.get('pageSize') ?? 20)));

    const where = {
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: 'insensitive' as const } },
              { phone: { contains: q } },
              // البحث برقم محلي مثل 0944… يطابق الرقم المخزّن بصيغة 963944…
              ...(phoneDigits(q).length >= 4 ? [{ phone: { contains: phoneDigits(q) } }] : []),
              { code: { contains: q, mode: 'insensitive' as const } },
              { email: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, code: true, fullName: true, phone: true, email: true, registeredAt: true, userId: true,
          appointments: { orderBy: { startsAt: 'desc' }, take: 1, select: { startsAt: true, status: true } },
        },
      }),
      prisma.patient.count({ where }),
    ]);

    void session;
    return ok({ rows, total, page, pageSize });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST /api/patients — إنشاء مريض جديد من لوحة التحكم. */
export async function POST(request: Request) {
  try {
    const { session, response } = await guard('patients.write');
    if (response) return response;

    const body = patientSchema.parse(await request.json());
    const patient = await prisma.patient.create({
      data: {
        code: await nextPatientCode(),
        fullName: body.fullName,
        phone: body.phone,
        email: body.email || null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        gender: body.gender,
        address: body.address,
        notes: body.notes,
        medicalHistory: { create: {} },
        dentalHistory: { create: {} },
      },
    });

    await audit({
      userId: session.sub, action: 'CREATE', entity: 'Patient', entityId: patient.id,
      patientId: patient.id, description: `إضافة مريض جديد ${patient.code}`, request,
    });

    return ok(patient, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** أرقام الهاتف بدون الصفر المحلي أو رمز الدولة */
function phoneDigits(q: string) {
  return q.replace(/\D/g, '').replace(/^00/, '').replace(/^963/, '').replace(/^0+/, '');
}
