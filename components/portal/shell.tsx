'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, CalendarDays, FileText, Home, LogOut, Menu, MessageCircle, Stethoscope, X } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { cn, formatShortDate } from '@/lib/utils';

const NAV = [
  { href: '/portal', label: 'الرئيسية', icon: Home, exact: true },
  { href: '/portal/appointments', label: 'مواعيدي', icon: CalendarDays },
  { href: '/portal/plan', label: 'خطتي العلاجية', icon: Stethoscope },
  { href: '/portal/medical', label: 'ملفي الطبي', icon: FileText },
  { href: '/portal/documents', label: 'المستندات', icon: FileText },
  { href: '/portal/contact', label: 'التواصل', icon: MessageCircle },
];

type Notification = { id: string; title: string; body: string | null; readAt: string | null; createdAt: string };

export function PortalShell({ name, children }: { name: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  const load = React.useCallback(async () => {
    const response = await fetch('/api/notifications');
    if (!response.ok) return;
    const payload = await response.json();
    setNotifications(payload.data);
  }, []);

  React.useEffect(() => {
    load();
    const timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  }, [load]);

  React.useEffect(() => setMenuOpen(false), [pathname]);

  const unread = notifications.filter((n) => !n.readAt).length;

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/portal">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm transition-colors',
                    active ? 'bg-orchid-50 font-medium text-orchid-700' : 'text-muted hover:text-ink',
                  )}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
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
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                  <div className="absolute left-0 top-12 z-40 w-80 overflow-hidden rounded-2xl border border-line bg-white shadow-lift">
                    <div className="border-b border-line px-4 py-3">
                      <p className="text-sm font-semibold">الإشعارات</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 && <p className="px-4 py-6 text-center text-sm text-muted">لا توجد إشعارات.</p>}
                      {notifications.map((item) => (
                        <div key={item.id} className={cn('border-b border-line px-4 py-3 last:border-0', !item.readAt && 'bg-orchid-50/50')}>
                          <p className="text-sm font-medium">{item.title}</p>
                          {item.body && <p className="mt-1 text-xs leading-6 text-muted">{item.body}</p>}
                          <p className="mt-1 text-[11px] text-muted">{formatShortDate(item.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button onClick={logout} className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-muted hover:bg-[#FDEEEE] hover:text-[#B3363F] lg:flex">
              <LogOut size={16} />
              تسجيل الخروج
            </button>

            <button onClick={() => setMenuOpen(true)} aria-label="فتح القائمة" className="rounded-lg p-2 text-muted hover:bg-orchid-50 lg:hidden">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/35" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Logo showWordmark={false} />
              <button onClick={() => setMenuOpen(false)} aria-label="إغلاق" className="p-1.5 text-muted">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted">
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
              <button onClick={logout} className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#B3363F]">
                <LogOut size={18} />
                تسجيل الخروج
              </button>
            </nav>
          </div>
        </div>
      )}

      <main className="container-page py-8">
        <p className="mb-6 text-sm text-muted">أهلاً بعودتك، {name}</p>
        {children}
      </main>

      <nav className="sticky bottom-0 z-30 flex border-t border-line bg-white/95 backdrop-blur lg:hidden">
        {NAV.slice(0, 5).map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]', active ? 'text-orchid-600' : 'text-muted')}
            >
              <item.icon size={19} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
