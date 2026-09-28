import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Section } from '@/components/public/section';
import { FaqList } from '@/components/public/faq-list';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'الأسئلة الشائعة',
  description: 'إجابات عن الحجز، التعديل، والعلاجات المتاحة في عيادة د. أنس جوبي في حلب.',
};

export default async function FaqPage() {
  const faqs = await prisma.faq.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });

  return (
    <Section>
      <h1 className="text-3xl font-semibold sm:text-4xl">الأسئلة الشائعة</h1>
      <span className="mb-8 mt-5 block h-px w-14 bg-champagne-400" />
      <div className="max-w-3xl">
        <FaqList items={faqs} />
        <p className="mt-8 text-sm text-muted">
          لم تجد إجابتك؟{' '}
          <Link href="/contact" className="text-orchid-600">راسلنا مباشرة</Link>.
        </p>
      </div>
    </Section>
  );
}
