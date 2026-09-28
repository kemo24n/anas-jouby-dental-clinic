import { SiteHeader } from '@/components/public/site-header';
import { SiteFooter } from '@/components/public/site-footer';
import { WhatsappFloat } from '@/components/public/whatsapp-float';
import { getClinicSettings } from '@/services/availability.service';
import { getHoursSummary } from '@/services/hours.service';

export const dynamic = 'force-dynamic';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, hours] = await Promise.all([getClinicSettings(), getHoursSummary()]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader whatsapp={settings.whatsapp} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} hours={hours} />
      <WhatsappFloat whatsapp={settings.whatsapp} />
    </div>
  );
}
