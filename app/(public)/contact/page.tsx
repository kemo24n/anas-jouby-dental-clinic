import type { Metadata } from 'next';
import { Phone, Mail, MapPin, Clock, MessageCircle, Smartphone } from 'lucide-react';
import { Section } from '@/components/public/section';
import { ContactForm } from '@/components/public/contact-form';
import { getClinicSettings } from '@/services/availability.service';
import { getHoursSummary } from '@/services/hours.service';
import { displayLocalPhone } from '@/lib/utils';
import { whatsappLink, WA_MESSAGES } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'تواصل معنا',
  description: 'عنوان عيادة الدكتورة أنس جوبي في العزيزية بحلب، أرقام الهاتف وواتساب، وساعات الدوام.',
};

export default async function ContactPage() {
  const [settings, hours] = await Promise.all([getClinicSettings(), getHoursSummary()]);

  return (
    <Section>
      <h1 className="text-3xl font-semibold sm:text-4xl">تواصل معنا</h1>
      <span className="mb-10 mt-5 block h-px w-14 bg-champagne-400" />

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <ul className="space-y-5 text-sm">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 text-orchid-500" />
              <div><p className="font-medium">العنوان</p><p className="mt-1 text-muted">{settings.address}</p></div>
            </li>
            <li className="flex items-start gap-3">
              <Phone size={18} className="mt-0.5 text-orchid-500" />
              <div>
                <p className="font-medium">الهاتف الأرضي</p>
                <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`} className="mt-1 block text-muted hover:text-orchid-600" dir="ltr">{settings.phone}</a>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Smartphone size={18} className="mt-0.5 text-orchid-500" />
              <div>
                <p className="font-medium">الموبايل وواتساب</p>
                <a href={`tel:+${settings.whatsapp.replace(/[^\d]/g, '')}`} className="mt-1 block text-muted hover:text-orchid-600" dir="ltr">{displayLocalPhone(settings.whatsapp)}</a>
              </div>
            </li>
            {settings.email && (
              <li className="flex items-start gap-3">
                <Mail size={18} className="mt-0.5 text-orchid-500" />
                <div><p className="font-medium">البريد الإلكتروني</p><p className="mt-1 text-muted">{settings.email}</p></div>
              </li>
            )}
            <li className="flex items-start gap-3">
              <Clock size={18} className="mt-0.5 text-orchid-500" />
              <div>
                <p className="font-medium">ساعات الدوام</p>
                <p className="mt-1 leading-7 text-muted">
                  {hours.map((h, i) => (
                    <span key={i} className="block">{h.days}: {h.hours}</span>
                  ))}
                </p>
              </div>
            </li>
          </ul>

          <a
            href={whatsappLink(WA_MESSAGES.general, settings.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-medium text-white"
          >
            <MessageCircle size={17} /> التواصل عبر واتساب
          </a>

          <div className="mt-8 overflow-hidden rounded-2xl border border-line">
            <iframe
              title="خريطة موقع العيادة"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${settings.longitude - 0.01}%2C${settings.latitude - 0.008}%2C${settings.longitude + 0.01}%2C${settings.latitude + 0.008}&layer=mapnik&marker=${settings.latitude}%2C${settings.longitude}`}
              className="h-[300px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <a
            href={settings.mapUrl ?? `https://maps.google.com/?q=${settings.latitude},${settings.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm text-orchid-600"
          >
            <MapPin size={16} /> فتح الموقع على الخرائط
          </a>
        </div>

        <div className="card p-6">
          <h2 className="mb-1 text-lg font-semibold">أرسل رسالة</h2>
          <p className="mb-5 text-sm text-muted">تصل رسالتك إلى العيادة، ويتم الرد عليها خلال ساعات الدوام.</p>
          <ContactForm />
        </div>
      </div>
    </Section>
  );
}
