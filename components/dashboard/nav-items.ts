import type { Permission } from '@/lib/permissions';

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  permission?: Permission;
  exact?: boolean;
};

/** القائمة الجانبية للوحة التحكم. الصلاحية تحدد الظهور، والخادم يفرضها فعلياً. */
export const DASHBOARD_NAV: NavItem[] = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: 'LayoutDashboard', exact: true },
  { href: '/dashboard/appointments', label: 'المواعيد', icon: 'CalendarDays', permission: 'appointments.read' },
  { href: '/dashboard/patients', label: 'المرضى', icon: 'Users', permission: 'patients.read' },
  { href: '/dashboard/records', label: 'الملفات الطبية', icon: 'ClipboardList', permission: 'clinical.read' },
  { href: '/dashboard/cases', label: 'الحالات', icon: 'Stethoscope', permission: 'cases.read' },
  { href: '/dashboard/treatment-plans', label: 'خطط العلاج', icon: 'ListChecks', permission: 'plans.read' },
  { href: '/dashboard/services', label: 'الخدمات', icon: 'Sparkles', permission: 'services.write' },
  { href: '/dashboard/payments', label: 'المدفوعات', icon: 'Wallet', permission: 'payments.read' },
  { href: '/dashboard/reports', label: 'التقارير', icon: 'BarChart3', permission: 'reports.read' },
  { href: '/dashboard/messages', label: 'الرسائل', icon: 'MessageSquare', permission: 'messages.read' },
  { href: '/dashboard/accounts', label: 'حسابات المرضى', icon: 'UserCog', permission: 'accounts.write' },
  { href: '/dashboard/settings', label: 'إعدادات العيادة', icon: 'Settings', permission: 'settings.write' },
  { href: '/dashboard/account', label: 'إعدادات الحساب', icon: 'UserRound' },
];

/** التنقل السفلي على الجوال. */
export const MOBILE_NAV: NavItem[] = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: 'LayoutDashboard', exact: true },
  { href: '/dashboard/appointments', label: 'المواعيد', icon: 'CalendarDays', permission: 'appointments.read' },
  { href: '/dashboard/patients', label: 'المرضى', icon: 'Users', permission: 'patients.read' },
];
