import Image from 'next/image';
import Link from 'next/link';
import { MEDIA } from '@/lib/media';
import { Logo } from '@/components/ui/logo';
import { BRAND } from '@/lib/brand';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_46%]">
      <div className="flex flex-col justify-center px-5 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 inline-flex">
            <Logo />
          </Link>
          {children}
          <p className="mt-10 text-xs text-muted">
            <Link href="/" className="hover:text-orchid-600">
              العودة إلى الموقع
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden lg:block">
        <Image
          src={MEDIA.waiting}
          alt="صالة الانتظار في العيادة"
          fill
          sizes="46vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-orchid-900/80 via-orchid-800/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <p className="max-w-sm text-2xl font-semibold leading-relaxed">
            {BRAND.clinicName}
          </p>
          <p className="mt-3 max-w-sm text-sm leading-8 text-white/80">
            المواعيد، ملفات المرضى، خطط العلاج والمدفوعات في مكان واحد.
          </p>
        </div>
      </div>
    </div>
  );
}
