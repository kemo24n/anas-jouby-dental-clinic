import type { Metadata, Viewport } from 'next';
// الخط مستضاف محلياً (بدون طلبات إلى Google) — أسرع وأكثر خصوصية
import '@fontsource/ibm-plex-sans-arabic/arabic-400.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-500.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-600.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-700.css';
import '@fontsource/ibm-plex-sans-arabic/latin-400.css';
import '@fontsource/ibm-plex-sans-arabic/latin-600.css';
import './globals.css';
import { BRAND } from '@/lib/brand';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: `${BRAND.doctorName} | طبيبة أسنان في حلب`,
    template: `%s | ${BRAND.shortClinicName}`,
  },
  description: BRAND.description,
  keywords: [...BRAND.keywords],
  authors: [{ name: `${BRAND.developer.company} — ${BRAND.developer.person}`, url: BRAND.developer.instagramUrl }],
  creator: BRAND.developer.company,
  openGraph: {
    type: 'website',
    locale: 'ar_SY',
    title: `${BRAND.doctorName} | طبيبة أسنان في حلب`,
    description: BRAND.description,
    siteName: BRAND.clinicName,
    images: [{ url: '/images/treatment-room.jpg', width: 986, height: 676, alt: 'غرفة المعالجة في العيادة' }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#A85A72',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
