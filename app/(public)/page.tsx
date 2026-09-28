import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, Layers, CalendarCheck, Clock3, Star, MapPin, Phone } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getClinicSettings } from '@/services/availability.service';
import { getHoursSummary, getOpeningHoursSpec } from '@/services/hours.service';
import { Section } from '@/components/public/section';
import { Gallery } from '@/components/public/gallery';
import { FaqList } from '@/components/public/faq-list';
import { MEDIA, GALLERY } from '@/lib/media';
import { BRAND } from '@/lib/brand';
import { whatsappLink, WA_MESSAGES } from '@/lib/whatsapp';
import { displayLocalPhone } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [settings, categories, testimonials, faqs, dentist, hours, openingHours] = await Promise.all([
    getClinicSettings(),
    prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { services: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 3 } },
    }),
    prisma.testimonial.findMany({ where: { isActive: true }, take: 3 }),
    prisma.faq.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 5 }),
    prisma.dentist.findFirst({ where: { isActive: true } }),
    getHoursSummary(),
    getOpeningHoursSpec(),
  ]);

  const years = dentist?.yearsExperience ?? 0;
  const openDays = hours.filter((h) => !h.closed);
  const mainHours = openDays[0]?.hours;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    name: settings.clinicName,
    image: MEDIA.room,
    telephone: settings.phone,
    ...(settings.email ? { email: settings.email } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.address,
      addressLocality: BRAND.city,
      addressRegion: 'حلب',
      addressCountry: 'SY',
    },
    geo: { '@type': 'GeoCoordinates', latitude: settings.latitude, longitude: settings.longitude },
    openingHours,
    medicalSpecialty: 'Dentistry',
    founder: { '@type': 'Person', name: BRAND.doctorName },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      {/* ——— الواجهة الأولى ——— */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {/* فيديو خلفية هادئ (بدون صوت) — صورة صالة الانتظار تظهر أولاً وتبقى بديلاً إن تعذّر تحميل الفيديو */}
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={MEDIA.waiting}
            aria-hidden
          >
            <source src={MEDIA.video.hero} type="video/mp4" />
            <source src={MEDIA.video.heroFallback} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-l from-canvas via-canvas/90 to-canvas/60" />
        </div>

        <div className="container-page relative grid items-center gap-10 py-20 sm:py-28 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="animate-rise">
            <p className="mb-4 text-sm text-champagne-500">{settings.tagline ?? `عيادة أسنان — ${BRAND.district}، ${BRAND.city}`}</p>
            <h1 className="text-4xl font-semibold leading-[1.25] sm:text-[52px]">{settings.heroTitle}</h1>
            <p className="mt-5 max-w-lg text-[15px] leading-8 text-muted">{settings.heroSubtitle}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/booking"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-orchid-500 px-7 text-sm font-medium text-white shadow-soft hover:bg-orchid-600"
              >
                احجز موعدك
              </Link>
              <a
                href={whatsappLink(WA_MESSAGES.booking, settings.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-orchid-200 bg-white/80 px-7 text-sm font-medium text-orchid-700 hover:bg-orchid-50"
              >
                واتساب: <span dir="ltr">{displayLocalPhone(settings.whatsapp)}</span>
              </a>
            </div>

            <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-5 border-t border-line pt-7 text-sm">
              {years > 0 && (
                <div>
                  <dt className="text-muted">سنة خبرة</dt>
                  <dd className="mt-1 text-2xl font-semibold">{years}</dd>
                </div>
              )}
              {mainHours && (
                <div>
                  <dt className="text-muted">الدوام</dt>
                  <dd className="mt-1 text-2xl font-semibold">{mainHours}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted">الموقع</dt>
                <dd className="mt-1 text-2xl font-semibold">{BRAND.district}</dd>
              </div>
            </dl>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-line shadow-lift">
              <Image src={MEDIA.room} alt="غرفة المعالجة في العيادة" fill sizes="480px" priority className="object-cover" />
            </div>
            <div className="absolute -bottom-6 right-6 w-60 rounded-2xl border border-line bg-white/95 p-4 shadow-lift backdrop-blur">
              <p className="text-xs text-muted">حجز إلكتروني</p>
              <p className="mt-1 text-sm font-medium">اختر الخدمة والوقت المتاح</p>
              <Link href="/booking" className="mt-3 inline-flex items-center gap-1 text-sm text-orchid-600">
                ابدأ الحجز <ArrowLeft size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ——— الخدمات ——— */}
      <Section id="services" title="العلاجات في العيادة" lead="من الفحص الأول حتى الزرع والتعويضات، كل العلاجات في عيادة واحدة.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <article key={category.id} className="card flex flex-col p-5">
              <h3 className="text-[17px] font-semibold">{category.name}</h3>
              <p className="mt-2 text-sm leading-7 text-muted">{category.description}</p>
              <ul className="mt-4 space-y-1.5 text-sm text-muted">
                {category.services.map((service) => (
                  <li key={service.id} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-champagne-400" />
                    {service.name}
                  </li>
                ))}
              </ul>
              <Link href={`/services#${category.slug}`} className="mt-auto inline-flex items-center gap-1 pt-5 text-sm text-orchid-600">
                التفاصيل <ArrowLeft size={15} />
              </Link>
            </article>
          ))}
        </div>
      </Section>

      {/* ——— لماذا العيادة ——— */}
      <section className="bg-orchid-50/70 py-16 sm:py-20">
        <div className="container-page">
          <h2 className="mb-10 max-w-xl text-2xl font-semibold sm:text-[28px]">لماذا عيادة الدكتورة أنس؟</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Clock3, title: `${years} سنة في المهنة`, text: 'خبرة طويلة في علاج الأسنان بمختلف حالاتها.' },
              { icon: GraduationCap, title: 'محاضِرة جامعية', text: 'تدرّس في كلية طب الأسنان إلى جانب عملها في العيادة.' },
              { icon: Layers, title: 'كل العلاجات في مكان واحد', text: 'لثة، مداواة، زرع، تعويضات، فينير وتبييض بالليزر.' },
              { icon: CalendarCheck, title: 'حجز سهل', text: 'احجز من الموقع أو عبر واتساب، وتصلك تفاصيل الموعد.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl bg-white p-5">
                <item.icon size={22} className="text-orchid-500" />
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— عن الطبيبة ——— */}
      <Section id="about">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="relative aspect-[5/4] overflow-hidden rounded-3xl border border-line">
            <Image
              src={dentist?.photoUrl ?? MEDIA.roomAlt}
              alt={dentist?.photoUrl ? `صورة ${BRAND.doctorName}` : 'عيادة الدكتورة أنس جوبي'}
              fill
              sizes="(max-width: 1024px) 100vw, 520px"
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="text-2xl font-semibold sm:text-[28px]">عن الطبيبة</h2>
            <p className="mt-2 text-sm text-champagne-500">{dentist?.title}</p>
            <span className="mt-5 block h-px w-14 bg-champagne-400" />
            <p className="mt-6 text-[15px] leading-8 text-muted">{dentist?.bio}</p>
            {dentist?.philosophy && <p className="mt-4 text-[15px] leading-8 text-muted">{dentist.philosophy}</p>}
            <Link href="/about" className="mt-6 inline-flex items-center gap-1 text-sm text-orchid-600">
              المزيد عن الطبيبة <ArrowLeft size={15} />
            </Link>
          </div>
        </div>
      </Section>

      {/* ——— آراء المرضى: تظهر فقط عند إضافة آراء حقيقية ——— */}
      {testimonials.length > 0 && (
        <section className="bg-rose-50/70 py-16 sm:py-20">
          <div className="container-page">
            <h2 className="mb-10 text-2xl font-semibold sm:text-[28px]">آراء المرضى</h2>
            <div className="grid gap-5 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <figure key={testimonial.id} className="rounded-2xl bg-white p-6">
                  <div className="flex gap-0.5 text-champagne-400" aria-label={`${testimonial.rating} من 5`}>
                    {Array.from({ length: testimonial.rating }).map((_, i) => <Star key={i} size={15} fill="currentColor" />)}
                  </div>
                  <blockquote className="mt-4 text-sm leading-8 text-ink">{testimonial.text}</blockquote>
                  <figcaption className="mt-4 text-sm text-muted">{testimonial.name}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ——— صور العيادة ——— */}
      <Section title="من داخل العيادة" lead="صالة الانتظار وغرفة المعالجة.">
        <Gallery images={GALLERY} />
      </Section>

      {/* ——— الأسئلة الشائعة ——— */}
      {faqs.length > 0 && (
        <Section title="الأسئلة الشائعة">
          <FaqList items={faqs} />
          <Link href="/faq" className="mt-6 inline-flex items-center gap-1 text-sm text-orchid-600">
            كل الأسئلة <ArrowLeft size={15} />
          </Link>
        </Section>
      )}

      {/* ——— موقع العيادة ——— */}
      <Section title="موقع العيادة" lead={settings.address}>
        <div className="overflow-hidden rounded-2xl border border-line">
          <iframe
            title="خريطة موقع العيادة"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${settings.longitude - 0.01}%2C${settings.latitude - 0.008}%2C${settings.longitude + 0.01}%2C${settings.latitude + 0.008}&layer=mapnik&marker=${settings.latitude}%2C${settings.longitude}`}
            className="h-[360px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a
            href={settings.mapUrl ?? `https://maps.google.com/?q=${settings.latitude},${settings.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-orchid-600"
          >
            <MapPin size={16} /> فتح الموقع على الخرائط
          </a>
          <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-2 text-orchid-600">
            <Phone size={16} /> <span dir="ltr">{settings.phone}</span>
          </a>
        </div>
      </Section>

      {/* ——— دعوة للحجز ——— */}
      <section className="container-page pb-20">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-l from-orchid-700 to-orchid-500 px-8 py-12 text-white sm:px-12">
          <h2 className="max-w-lg text-2xl font-semibold leading-relaxed text-white sm:text-3xl">احجز موعدك في العيادة</h2>
          {mainHours && (
            <p className="mt-3 text-sm text-white/85">
              {openDays[0].days}: {mainHours}
            </p>
          )}
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/booking" className="inline-flex h-12 items-center rounded-xl bg-white px-7 text-sm font-medium text-orchid-700">
              حجز موعد
            </Link>
            <a
              href={whatsappLink(WA_MESSAGES.booking, settings.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center rounded-xl border border-white/60 px-7 text-sm font-medium"
            >
              الحجز عبر واتساب
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
