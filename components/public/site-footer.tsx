import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { whatsappLink, WA_MESSAGES } from '@/lib/whatsapp';
import { BRAND } from '@/lib/brand';
import { displayLocalPhone } from '@/lib/utils';
import type { HoursLine } from '@/services/hours.service';

type Settings = {
  clinicName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
};

const services = [
  { href: '/services#periodontics', label: 'اللثة' },
  { href: '/services#endodontics', label: 'المداواة الحافظة واللبية' },
  { href: '/services#implants', label: 'زراعة الأسنان' },
  { href: '/services#prosthodontics', label: 'تيجان وجسور زيركون وخزف' },
  { href: '/services#cosmetic', label: 'الفينير وتبييض الأسنان بالليزر' },
];

export function SiteFooter({ settings, hours }: { settings: Settings; hours: HoursLine[] }) {
  const socials = [
    { label: 'إنستغرام', href: settings.instagram },
    { label: 'فيسبوك', href: settings.facebook },
    { label: 'تيك توك', href: settings.tiktok },
    { label: 'يوتيوب', href: settings.youtube },
  ].filter((s) => s.href && /^https?:\/\//.test(s.href));

  return (
    <footer className="mt-24 border-t border-line bg-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-7 text-muted">
            عيادة الدكتورة أنس جوبي لطب الأسنان في حي العزيزية بحلب.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold">روابط سريعة</h4>
          <ul className="space-y-2.5 text-sm text-muted">
            <li><Link href="/" className="hover:text-orchid-600">الرئيسية</Link></li>
            <li><Link href="/about" className="hover:text-orchid-600">عن الطبيبة</Link></li>
            <li><Link href="/booking" className="hover:text-orchid-600">حجز موعد</Link></li>
            <li><Link href="/faq" className="hover:text-orchid-600">الأسئلة الشائعة</Link></li>
            <li><Link href="/contact" className="hover:text-orchid-600">تواصل معنا</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold">العلاجات</h4>
          <ul className="space-y-2.5 text-sm text-muted">
            {services.map((s) => (
              <li key={s.href}><Link href={s.href} className="hover:text-orchid-600">{s.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold">تواصل معنا</h4>
          <ul className="space-y-3 text-sm text-muted">
            <li className="flex items-start gap-2.5"><MapPin size={16} className="mt-0.5 shrink-0 text-orchid-400" />{settings.address}</li>
            {settings.phone && (
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="shrink-0 text-orchid-400" />
                <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`} dir="ltr" className="hover:text-orchid-600">{settings.phone}</a>
              </li>
            )}
            <li className="flex items-center gap-2.5">
              <MessageCircle size={16} className="shrink-0 text-orchid-400" />
              <a href={`tel:+${settings.whatsapp.replace(/[^\d]/g, '')}`} dir="ltr" className="hover:text-orchid-600">{displayLocalPhone(settings.whatsapp)}</a>
            </li>
            {settings.email && (
              <li className="flex items-center gap-2.5"><Mail size={16} className="shrink-0 text-orchid-400" />{settings.email}</li>
            )}
            {hours.length > 0 && (
              <li className="flex items-start gap-2.5">
                <Clock size={16} className="mt-0.5 shrink-0 text-orchid-400" />
                <span>
                  {hours.map((h, i) => (
                    <span key={i} className="block">{h.days}: {h.hours}</span>
                  ))}
                </span>
              </li>
            )}
          </ul>
          <a
            href={whatsappLink(WA_MESSAGES.general, settings.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex h-10 items-center rounded-xl border border-orchid-200 px-4 text-sm text-orchid-700 hover:bg-orchid-50"
          >
            التواصل عبر واتساب
          </a>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 pb-24 pt-5 text-xs text-muted">
          <p>© {new Date().getFullYear()} {settings.clinicName}. جميع الحقوق محفوظة.</p>
          {socials.length > 0 && (
            <div className="flex gap-4">
              {socials.map((s) => (
                <a key={s.label} href={s.href!} target="_blank" rel="noopener noreferrer" className="hover:text-orchid-600">
                  {s.label}
                </a>
              ))}
            </div>
          )}
          <p dir="ltr" className="text-muted">
            Designed &amp; developed by{' '}
            <a href={BRAND.developer.instagramUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-orchid-600 hover:underline">
              {BRAND.developer.company}
            </a>{' '}
            · {BRAND.developer.person} ·{' '}
            <a href={BRAND.developer.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-orchid-600">
              @{BRAND.developer.instagram}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
