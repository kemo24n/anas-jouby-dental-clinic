import { MessageCircle, Phone } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ContactForm } from '@/components/public/contact-form';
import { WA_MESSAGES, whatsappLink } from '@/lib/whatsapp';
import { PUBLIC_WHATSAPP } from '@/lib/env';
import { getClinicSettings } from '@/services/availability.service';

export const metadata = { title: 'التواصل' };
export const dynamic = 'force-dynamic';

export default async function PortalContactPage() {
  const settings = await getClinicSettings();

  return (
    <div className="animate-rise space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ok/15 text-ok">
              <MessageCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-medium">واتساب</p>
              <a
                href={whatsappLink(WA_MESSAGES.general, PUBLIC_WHATSAPP)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ok hover:underline"
              >
                مراسلة العيادة مباشرة
              </a>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orchid-50 text-orchid-600">
              <Phone size={20} />
            </div>
            <div>
              <p className="text-sm font-medium">الهاتف</p>
              <a href={`tel:${settings.phone}`} dir="ltr" className="block text-sm text-muted hover:text-orchid-600">
                {settings.phone}
              </a>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="أرسل رسالة" description="ستصل رسالتك إلى فريق العيادة وسنعاود التواصل معك." />
        <CardBody>
          <ContactForm />
        </CardBody>
      </Card>
    </div>
  );
}
