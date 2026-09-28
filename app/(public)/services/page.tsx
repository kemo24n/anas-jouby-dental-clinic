import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Clock } from 'lucide-react';
import { prisma } from '@/lib/db';
import { Section } from '@/components/public/section';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'الخدمات',
  description: 'خدمات عيادة د. أنس جوبي في حلب: اللثة، المداواة الحافظة واللبية، الزرع، تيجان وجسور الزيركون والخزف، الفينير، وتبييض الأسنان بالليزر.',
};

export default async function ServicesPage() {
  const categories = await prisma.serviceCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: { services: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
  });

  return (
    <div className="pb-16">
      <Section className="pb-6 sm:pb-8">
        <h1 className="text-3xl font-semibold sm:text-4xl">الخدمات</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-8 text-muted">
          العلاجات المتوفرة في العيادة. تُحدَّد خطة العلاج وتكلفتها بعد الفحص حسب كل حالة.
        </p>
        <span className="mt-5 block h-px w-14 bg-champagne-400" />
      </Section>

      {categories.map((category) => (
        <Section key={category.id} id={category.slug} className="scroll-mt-24 py-6 sm:py-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">{category.name}</h2>
            {category.description && <p className="mt-2 text-sm text-muted">{category.description}</p>}
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {category.services.map((service) => (
              <article key={service.id} className="card overflow-hidden">
                {service.imageUrl?.startsWith('/') && (
                  <div className="relative aspect-[16/10] bg-orchid-50">
                    <Image src={service.imageUrl} alt={service.name} fill sizes="(max-width: 640px) 100vw, 360px" className="object-cover" />
                  </div>
                )}
                {!service.imageUrl?.startsWith('/') && <div className="h-1 bg-gradient-to-l from-orchid-400 via-rose-300 to-champagne-300" />}
                <div className="p-5">
                  <h3 className="font-semibold">{service.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted">{service.description}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1.5 text-muted">
                      <Clock size={14} /> الجلسة نحو {service.durationMin} دقيقة
                    </span>
                    {service.startingPrice && (
                      <span className="font-medium text-champagne-600">تبدأ من {Number(service.startingPrice)} $</span>
                    )}
                  </div>
                  <Link
                    href="/booking"
                    className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-xl border border-orchid-200 text-sm text-orchid-700 hover:bg-orchid-50"
                  >
                    احجز هذه الخدمة
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </Section>
      ))}
    </div>
  );
}
