'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, MessageCircle } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { whatsappLink, WA_MESSAGES } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'الرئيسية' },
  { href: '/about', label: 'عن الطبيبة' },
  { href: '/services', label: 'الخدمات' },
  { href: '/faq', label: 'الأسئلة الشائعة' },
  { href: '/contact', label: 'تواصل معنا' },
];

export function SiteHeader({ whatsapp }: { whatsapp: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/85 backdrop-blur">
      <div className="container-page flex h-[72px] items-center justify-between gap-4">
        <Link href="/" aria-label="الصفحة الرئيسية">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="التنقل الرئيسي">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-lg px-3.5 py-2 text-sm transition-colors',
                pathname === link.href ? 'text-orchid-600' : 'text-ink/80 hover:text-orchid-600',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={whatsappLink(WA_MESSAGES.general, whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="تواصل عبر واتساب"
            className="rounded-xl border border-line p-2.5 text-orchid-600 hover:bg-orchid-50 lg:hidden"
          >
            <MessageCircle size={18} />
          </a>
          <Link
            href="/booking"
            className="hidden h-10 items-center rounded-xl bg-orchid-500 px-5 text-sm font-medium text-white hover:bg-orchid-600 sm:inline-flex"
          >
            حجز موعد
          </Link>
          <Link href="/login" className="hidden rounded-xl px-3 py-2 text-sm text-muted hover:text-ink lg:block">
            دخول
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={open}
            className="rounded-xl border border-line p-2.5 lg:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line bg-white lg:hidden" aria-label="التنقل للجوال">
          <div className="container-page flex flex-col py-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-line/60 py-3.5 text-sm text-ink last:border-0"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 py-3">
              <Link href="/booking" onClick={() => setOpen(false)} className="flex-1 rounded-xl bg-orchid-500 px-4 py-2.5 text-center text-sm text-white">
                حجز موعد
              </Link>
              <Link href="/login" onClick={() => setOpen(false)} className="rounded-xl border border-line px-4 py-2.5 text-sm">
                دخول
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
