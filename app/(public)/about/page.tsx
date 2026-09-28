import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { Section } from '@/components/public/section';
import { MEDIA } from '@/lib/media';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'عن الطبيبة',
  description: 'الدكتورة أنس جوبي، طبيبة أسنان في حلب ومحاضِرة في كلية طب الأسنان، بخبرة 35 سنة.',
};

export default async function AboutPage() {
  const dentist = await prisma.dentist.findFirst({ where: { isActive: true } });
  if (!dentist) {
    return <Section title="عن الطبيبة"><p className="text-muted">لم تُضَف بيانات الطبيبة بعد.</p></Section>;
  }

  const blocks = [
    { title: 'الدراسة', items: dentist.education },
    { title: 'الشهادات', items: dentist.certifications },
    { title: 'العلاجات التي تقدّمها', items: dentist.specializations },
    { title: 'اللغات', items: dentist.languages },
    { title: 'العضويات', items: dentist.memberships },
    { title: 'التكريمات', items: dentist.awards },
  ].filter((block) => block.items.length > 0);

  return (
    <>
      <Section>
        <div className="grid items-start gap-10 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-line">
            <Image
              src={dentist.photoUrl ?? MEDIA.room}
              alt={dentist.photoUrl ? `صورة ${dentist.fullName}` : 'غرفة المعالجة في العيادة'}
              fill
              sizes="(max-width: 1024px) 100vw, 480px"
              priority
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-3xl font-semibold sm:text-4xl">{dentist.fullName}</h1>
            <p className="mt-3 text-sm text-champagne-500">{dentist.title}</p>
            <span className="mt-5 block h-px w-14 bg-champagne-400" />
            <p className="mt-6 text-[15px] leading-8 text-muted">{dentist.bio}</p>
            {dentist.philosophy && (
              <div className="mt-6 rounded-2xl border border-orchid-200 bg-orchid-50/60 p-5">
                <h2 className="text-sm font-semibold">طريقة العمل</h2>
                <p className="mt-2 text-sm leading-8 text-muted">{dentist.philosophy}</p>
              </div>
            )}
            <Link href="/booking" className="mt-7 inline-flex h-11 items-center rounded-xl bg-orchid-500 px-6 text-sm font-medium text-white hover:bg-orchid-600">
              احجز موعدك
            </Link>
          </div>
        </div>
      </Section>

      <Section className="pt-0">
        <div className={blocks.length === 1 ? 'grid gap-5' : 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3'}>
          {blocks.map((block) => (
            <div key={block.title} className="card p-6">
              <h2 className="font-semibold">{block.title}</h2>
              <ul className={blocks.length === 1 ? 'mt-4 grid gap-x-8 gap-y-2 text-sm leading-7 text-muted sm:grid-cols-2 lg:grid-cols-3' : 'mt-3 space-y-2 text-sm leading-7 text-muted'}>
                {block.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-champagne-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
