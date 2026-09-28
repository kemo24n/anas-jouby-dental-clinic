import { describe, expect, it } from 'vitest';
import { can, isStaff, permissionsFor, PERMISSIONS, STAFF_ROLES } from '@/lib/permissions';

describe('permissions matrix', () => {
  it('المدير يملك كل الصلاحيات', () => {
    for (const permission of PERMISSIONS) {
      expect(can('ADMIN', permission)).toBe(true);
    }
    expect(permissionsFor('ADMIN')).toHaveLength(PERMISSIONS.length);
  });

  it('المريض لا يملك أي صلاحية إدارية', () => {
    for (const permission of PERMISSIONS) {
      expect(can('PATIENT', permission)).toBe(false);
    }
    expect(permissionsFor('PATIENT')).toEqual([]);
  });

  it('موظفة الاستقبال لا تملك وصولاً للمعلومات السريرية إطلاقاً', () => {
    expect(can('RECEPTIONIST', 'clinical.read')).toBe(false);
    expect(can('RECEPTIONIST', 'clinical.write')).toBe(false);
    expect(can('RECEPTIONIST', 'cases.read')).toBe(false);
    expect(can('RECEPTIONIST', 'cases.write')).toBe(false);
    expect(can('RECEPTIONIST', 'plans.read')).toBe(false);
    expect(can('RECEPTIONIST', 'plans.write')).toBe(false);
  });

  it('موظفة الاستقبال تملك صلاحيات الإدارة اليومية', () => {
    expect(can('RECEPTIONIST', 'patients.read')).toBe(true);
    expect(can('RECEPTIONIST', 'patients.write')).toBe(true);
    expect(can('RECEPTIONIST', 'appointments.read')).toBe(true);
    expect(can('RECEPTIONIST', 'appointments.write')).toBe(true);
    expect(can('RECEPTIONIST', 'payments.read')).toBe(true);
    expect(can('RECEPTIONIST', 'payments.write')).toBe(true);
  });

  it('الطبيبة تملك الوصول السريري الكامل لكنها لا تدير الموظفين أو إعدادات العيادة', () => {
    expect(can('DENTIST', 'clinical.read')).toBe(true);
    expect(can('DENTIST', 'clinical.write')).toBe(true);
    expect(can('DENTIST', 'plans.write')).toBe(true);
    expect(can('DENTIST', 'accounts.write')).toBe(false);
    expect(can('DENTIST', 'settings.write')).toBe(false);
    expect(can('DENTIST', 'services.write')).toBe(false);
  });

  it('لا صلاحية بلا دور', () => {
    expect(can(undefined, 'patients.read')).toBe(false);
    expect(can(null, 'patients.read')).toBe(false);
  });

  it('isStaff تميّز أدوار الفريق عن المريض', () => {
    for (const role of STAFF_ROLES) {
      expect(isStaff(role)).toBe(true);
    }
    expect(isStaff('PATIENT')).toBe(false);
    expect(isStaff(undefined)).toBe(false);
  });

  it('لا تكرار في قائمة الصلاحيات لكل دور', () => {
    for (const role of STAFF_ROLES) {
      const list = permissionsFor(role);
      expect(new Set(list).size).toBe(list.length);
    }
  });
});
