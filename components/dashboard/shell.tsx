'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import { Bell, LogOut, Menu, MoreHorizontal, Search, X } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { cn, formatArabicTime, formatShortDate } from '@/lib/utils';
import { can, type Permission } from '@/lib/permissions';
import { roleLabels, appointmentStatusLabels } from '@/lib/labels';
import type { Role } from '@prisma/client';
import { DASHBOARD_NAV, MOBILE_NAV, type NavItem } from './nav-items';

type Notification = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const Component = (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[name];
  return Component ? <Component size={size} /> : null;
}

function visible(items: NavItem[], role: Role) {
  return items.filter((item) => !item.permission || can(role, item.permission as Permission));
}

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function DashboardShell({
  role,
  name,
  children,
}: {
  role: Role;
  name: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const items = visible(DASHBOARD_NAV, role);
  const mobileItems = visible(MOBILE_NAV, role);

  return (
    <div className="min-h-screen bg-canvas">
      {/* الشريط الجانبي — سطح المكتب */}
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-64 flex-col border-l border-line bg-white lg:flex">
        <div className="border-b border-line px-5 py-4">
          <Link href="/dashboard">
            <Logo />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                isActive(pathname, item)
                  ? 'bg-orchid-50 font-medium text-orchid-700'
                  : 'text-muted hover:bg-orchid-50/60 hover:text-ink',
              )}
            >
              <Icon name={item.icon} />
              {item.label}
            </Link>
          ))}
          <LogoutButton />
        </nav>
        <div className="border-t border-line px-5 py-4">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted">{roleLabels[role]}</p>
        </div>
      </aside>

      {/* قائمة الجوال */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/35" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-72 flex-col bg-white">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Logo showWordmark={false} />
              <button onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة" className="p-1.5 text-muted">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm',
                    isActive(pathname, item) ? 'bg-orchid-50 font-medium text-orchid-700' : 'text-muted',
                  )}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </Link>
              ))}
              <LogoutButton />
            </nav>
          </div>
        </div>
      )}

      <div className="lg:pr-64">
        <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="فتح القائمة"
              className="rounded-lg p-2 text-muted hover:bg-orchid-50 lg:hidden"
            >
              <Menu size={20} />
            </button>
            <GlobalSearch canSearch={can(role, 'patients.read')} />
            <NotificationBell />
          </div>
        </header>

        <main className="px-4 pb-24 pt-6 sm:px-6 lg:pb-12">{children}</main>
      </div>

      {/* التنقل السفلي — الجوال */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-white/95 backdrop-blur lg:hidden">
        {mobileItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]',
              isActive(pathname, item) ? 'text-orchid-600' : 'text-muted',
            )}
          >
            <Icon name={item.icon} size={20} />
            {item.label}
          </Link>
        ))}
        <button
          onClick={() => setMenuOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] text-muted"
        >
          <MoreHorizontal size={20} />
          المزيد
        </button>
      </nav>
    </div>
  );
}

function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  return (
    <button
      onClick={async () => {
        setLoading(true);
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
      }}
      disabled={loading}
      className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-[#FDEEEE] hover:text-[#B3363F]"
    >
      <LogOut size={18} />
      تسجيل الخروج
    </button>
  );
}

/** البحث الشامل: مرضى ومواعيد. */
function GlobalSearch({ canSearch }: { canSearch: boolean }) {
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [results, setResults] = React.useState<{
    patients: { id: string; code: string; fullName: string; phone: string }[];
    appointments: { id: string; code: string; startsAt: string; status: keyof typeof appointmentStatusLabels; patient: { fullName: string } }[];
  }>({ patients: [], appointments: [] });
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!canSearch || query.trim().length < 2) {
      setResults({ patients: [], appointments: [] });
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const payload = await response.json();
        if (response.ok) setResults(payload.data);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [query, canSearch]);

  if (!canSearch) return <div className="flex-1" />;

  const hasResults = results.patients.length > 0 || results.appointments.length > 0;

  return (
    <div className="relative flex-1">
      <Search size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        placeholder="ابحث عن مريض أو موعد…"
        aria-label="البحث الشامل"
        className="h-10 w-full max-w-md rounded-xl border border-line bg-white pr-10 text-sm placeholder:text-muted/70 focus:border-orchid-400 focus:outline-none focus:ring-2 focus:ring-orchid-200"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute inset-x-0 top-12 z-40 max-h-96 max-w-md overflow-y-auto rounded-2xl border border-line bg-white p-2 shadow-lift">
          {loading && <p className="px-3 py-3 text-sm text-muted">جارٍ البحث…</p>}
          {!loading && !hasResults && <p className="px-3 py-3 text-sm text-muted">لا توجد نتائج مطابقة.</p>}

          {results.patients.length > 0 && (
            <div className="mb-1">
              <p className="px-3 py-1.5 text-[11px] font-medium text-muted">المرضى</p>
              {results.patients.map((patient) => (
                <Link
                  key={patient.id}
                  href={`/dashboard/patients/${patient.id}`}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-orchid-50"
                >
                  <span>{patient.fullName}</span>
                  <span dir="ltr" className="text-xs text-muted">
                    {patient.code}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {results.appointments.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-[11px] font-medium text-muted">المواعيد</p>
              {results.appointments.map((appointment) => (
                <Link
                  key={appointment.id}
                  href="/dashboard/appointments"
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-orchid-50"
                >
                  <span>{appointment.patient.fullName}</span>
                  <span className="text-xs text-muted">
                    {formatShortDate(appointment.startsAt)} · {appointmentStatusLabels[appointment.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** مركز الإشعارات. */
function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<Notification[]>([]);

  const load = React.useCallback(async () => {
    const response = await fetch('/api/notifications');
    if (!response.ok) return;
    const payload = await response.json();
    setItems(payload.data);
  }, []);

  React.useEffect(() => {
    load();
    const timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  }, [load]);

  const unread = items.filter((item) => !item.readAt).length;

  async function markAll() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    load();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label="الإشعارات"
        className="relative rounded-lg p-2 text-muted hover:bg-orchid-50 hover:text-ink"
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute left-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orchid-500 px-1 text-[10px] font-medium text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-12 z-40 w-80 overflow-hidden rounded-2xl border border-line bg-white shadow-lift">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-sm font-semibold">الإشعارات</p>
              {unread > 0 && (
                <button onClick={markAll} className="text-xs text-orchid-600 hover:underline">
                  تعليم الكل كمقروء
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 && <p className="px-4 py-6 text-center text-sm text-muted">لا توجد إشعارات.</p>}
              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn('border-b border-line px-4 py-3 last:border-0', !item.readAt && 'bg-orchid-50/50')}
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  {item.body && <p className="mt-1 text-xs leading-6 text-muted">{item.body}</p>}
                  <p className="mt-1 text-[11px] text-muted">
                    {formatShortDate(item.createdAt)} · {formatArabicTime(item.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
