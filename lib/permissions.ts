import type { Role } from '@prisma/client';

/**
 * صلاحيات النظام. مصدر الحقيقة الوحيد — تُستخدم في الخادم قبل كل عملية حساسة،
 * وتُستخدم في الواجهة فقط لإخفاء ما لا يملك المستخدم صلاحيته.
 */
export const PERMISSIONS = [
  'patients.read',
  'patients.write',
  'patients.delete',
  'appointments.read',
  'appointments.write',
  'clinical.read', // السجلات الطبية والسنية والملاحظات السريرية ومخطط الأسنان
  'clinical.write',
  'cases.read',
  'cases.write',
  'plans.read',
  'plans.write',
  'payments.read',
  'payments.write',
  'files.read',
  'files.write',
  'reports.read',
  'services.write',
  'settings.write',
  'accounts.write', // إدارة حسابات المرضى (الدكتورة فقط)
  'audit.read',
  'messages.read',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [...PERMISSIONS],
  DENTIST: [
    'patients.read', 'patients.write',
    'appointments.read', 'appointments.write',
    'clinical.read', 'clinical.write',
    'cases.read', 'cases.write',
    'plans.read', 'plans.write',
    'payments.read',
    'files.read', 'files.write',
    'reports.read',
    'messages.read',
  ],
  // موظفة الاستقبال: إدارة يومية بدون وصول إلى المعلومات السريرية
  RECEPTIONIST: [
    'patients.read', 'patients.write',
    'appointments.read', 'appointments.write',
    'payments.read', 'payments.write',
    'messages.read',
  ],
  PATIENT: [],
};

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function permissionsFor(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export const STAFF_ROLES: Role[] = ['ADMIN', 'DENTIST', 'RECEPTIONIST'];

export function isStaff(role: Role | undefined | null) {
  return !!role && STAFF_ROLES.includes(role);
}
