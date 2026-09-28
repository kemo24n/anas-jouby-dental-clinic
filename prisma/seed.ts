/**
 * التهيئة الأولى لعيادة الدكتورة أنس جوبي.
 * Production seed for Dr. Anas Jouby's clinic — real clinic info, NO fake patients,
 * NO fake reviews, NO demo accounts.
 *
 *   npm run seed
 *
 * حساب واحد فقط للإدارة (الدكتورة أنس):
 *   - SEED_ADMIN_PHONE     (افتراضياً 0944655028)
 *   - SEED_ADMIN_PASSWORD  (إن تُرك فارغاً تُولَّد كلمة قوية عشوائياً وتُطبع مرة واحدة)
 * يُطلب تغيير كلمة المرور عند أول دخول. لا توجد أي بيانات مرضى أو مواعيد.
 */
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { ADULT_TEETH } from '../lib/teeth';
import { SERVICE_IMAGES } from '../lib/media';
import { normalizeSyrianMobile } from '../lib/utils';

const prisma = new PrismaClient();
const isProd = process.env.NODE_ENV === 'production';

function strongPassword() {
  // 18 حرفاً من أبجدية لا تحتوي على أحرف متشابهة، مع ضمان وجود رقم ورمز
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = randomBytes(16);
  let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `${out}#7`;
}

function isWeak(password: string) {
  return (
    password.length < 10 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password) ||
    ['ChangeMe123!', 'Patient123!', 'Password123!', 'Admin123!'].includes(password)
  );
}


async function main() {
  console.log('⏳ تهيئة بيانات عيادة الدكتورة أنس جوبي...');

  // التهيئة تتم مرة واحدة فقط. بعدها لا تُعاد أي بيانات حذفتها الدكتورة (خدمات، أسئلة...)
  if (await prisma.clinicSettings.findUnique({ where: { id: 'singleton' } })) {
    console.log('✅ العيادة مهيّأة مسبقاً — لا تغيير.');
    return;
  }

  // ---------- إعدادات العيادة ----------
  const clinic = {
    clinicName: 'عيادة الدكتورة أنس جوبي لطب الأسنان',
    dentistName: 'د. أنس جوبي',
    tagline: 'عيادة أسنان — العزيزية، حلب',
    phone: '021 212 1859',
    whatsapp: '963944655028',
    email: '',
    address: 'حلب، العزيزية، شارع كنيسة اللاتين، فوق محل الملاك الأبيض',
    // مركز حي العزيزية — يُعدَّل من لوحة التحكم بعد أخذ دبوس خرائط جوجل الدقيق للعيادة
    latitude: 36.2080,
    longitude: 37.1535,
    mapUrl:
      'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent('كنيسة اللاتين العزيزية حلب'),
    instagram: '',
    facebook: '',
    tiktok: '',
    youtube: '',
    logoUrl: null,
    primaryColor: '#B7687F',
    secondaryColor: '#EDC9CF',
    accentColor: '#C4A27C',
    slotMinutes: 30,
    bufferMinutes: 10,
    maxAdvanceDays: 60,
    cancellationPolicy: 'لتعديل الموعد أو إلغائه يرجى التواصل مع العيادة قبل 24 ساعة على الأقل.',
    heroTitle: '35 سنة في طب الأسنان',
    heroSubtitle:
      'الدكتورة أنس جوبي، طبيبة أسنان ومحاضِرة في كلية طب الأسنان. علاج اللثة، المداواة، الزرع، تيجان الزيركون والخزف، الفينير وتبييض الأسنان بالليزر.',
  };
  await prisma.clinicSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton', ...clinic },
  });

  // ---------- الأسنان (ترقيم FDI) ----------
  for (const tooth of ADULT_TEETH) {
    await prisma.tooth.upsert({
      where: { number: tooth.number },
      update: { nameAr: tooth.nameAr, quadrant: tooth.quadrant },
      create: { number: tooth.number, quadrant: tooth.quadrant, nameAr: tooth.nameAr, isAdult: true },
    });
  }

  // ---------- الحساب الوحيد للإدارة: الدكتورة أنس ----------
  // الدخول برقم الموبايل. لا توجد حسابات أخرى للفريق — المرضى ينشئون حساباتهم بأنفسهم
  // أو تنشئها الدكتورة من لوحة التحكم.
  const adminPhone = normalizeSyrianMobile(process.env.SEED_ADMIN_PHONE || '0944655028');
  if (!adminPhone) throw new Error('SEED_ADMIN_PHONE يجب أن يكون رقم موبايل سوري مثل 0944655028');
  const provided = process.env.SEED_ADMIN_PASSWORD;
  if (provided && isWeak(provided)) {
    if (isProd) throw new Error('SEED_ADMIN_PASSWORD ضعيفة. استخدم 10 أحرف على الأقل مع حرف كبير وصغير ورقم.');
    console.warn('⚠️  SEED_ADMIN_PASSWORD ضعيفة — مقبولة فقط في بيئة التطوير.');
  }
  const adminPassword = provided || strongPassword();

  const existingAdmin = await prisma.user.findUnique({ where: { phone: adminPhone } });
  const dentistUser =
    existingAdmin ??
    (await prisma.user.create({
      data: {
        phone: adminPhone,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        fullName: 'د. أنس جوبي',
        role: Role.ADMIN,
        mustChangePassword: true,
      },
    }));

  const dentistProfile = {
    fullName: 'د. أنس جوبي',
    title: 'طبيبة أسنان — محاضِرة في كلية طب الأسنان',
    bio:
      'الدكتورة أنس جوبي طبيبة أسنان تمارس المهنة منذ 35 سنة، وتدرّس في كلية طب الأسنان إلى جانب عملها في العيادة. ' +
      'تستقبل مرضاها في عيادتها بحي العزيزية في حلب، وتقدّم فيها معظم علاجات الأسنان: اللثة، المداواة الحافظة واللبية، ' +
      'الزرع، التيجان والجسور من الزيركون والخزف، الفينير، وتبييض الأسنان بالليزر.',
    philosophy: null,
    education: [] as string[],
    certifications: [] as string[],
    specializations: [
      'علاج اللثة',
      'المداواة الحافظة',
      'المداواة اللبية (علاج العصب)',
      'زراعة الأسنان',
      'التعويضات الثابتة: جسور وتيجان زيركون وخزف',
      'الفينير',
      'تبييض الأسنان بالليزر',
    ],
    languages: [] as string[],
    memberships: [] as string[],
    awards: [] as string[],
    yearsExperience: 35,
    photoUrl: null,
  };
  const dentist = await prisma.dentist.upsert({
    where: { userId: dentistUser.id },
    update: {},
    create: { userId: dentistUser.id, ...dentistProfile },
  });

  // ---------- ساعات الدوام: 11 صباحاً – 6 مساءً، العطلة الجمعة والأحد ----------
  // 0 الأحد ... 6 السبت
  for (let weekday = 0; weekday <= 6; weekday++) {
    const closed = weekday === 0 || weekday === 5;
    const h = { weekday, startTime: '11:00', endTime: '18:00', isClosed: closed, breakStart: null, breakEnd: null };
    await prisma.workingHour.upsert({
      where: { dentistId_weekday: { dentistId: dentist.id, weekday } },
      update: {},
      create: { ...h, dentistId: dentist.id },
    });
  }

  // ---------- الأقسام والخدمات (بدون أسعار — تُضاف من لوحة التحكم عند الرغبة) ----------
  const categories = [
    { name: 'الفحص والاستشارة', slug: 'general', description: 'أول زيارة: فحص الفم والأسنان وتحديد العلاج المناسب.', sortOrder: 1 },
    { name: 'اللثة', slug: 'periodontics', description: 'تشخيص أمراض اللثة وعلاجها.', sortOrder: 2 },
    { name: 'المداواة', slug: 'endodontics', description: 'المداواة الحافظة (الحشوات) والمداواة اللبية (علاج العصب).', sortOrder: 3 },
    { name: 'التعويضات الثابتة', slug: 'prosthodontics', description: 'جسور وتيجان زيركون وخزف.', sortOrder: 4 },
    { name: 'التجميل', slug: 'cosmetic', description: 'الفينير وتبييض الأسنان بالليزر.', sortOrder: 5 },
    { name: 'زراعة الأسنان', slug: 'implants', description: 'تعويض الأسنان المفقودة بالزرع.', sortOrder: 6 },
    { name: 'تقويم الأسنان', slug: 'orthodontics', description: 'ترتيب الأسنان وتصحيح الإطباق.', sortOrder: 7 },
  ];
  const categoryMap: Record<string, string> = {};
  for (const c of categories) {
    const created = await prisma.serviceCategory.upsert({ where: { slug: c.slug }, update: {}, create: c });
    categoryMap[c.slug] = created.id;
  }

  const services = [
    { slug: 'consultation', name: 'فحص واستشارة', category: 'general', durationMin: 30, description: 'فحص الأسنان واللثة، وشرح الحالة وخيارات العلاج قبل البدء بأي إجراء.' },
    { slug: 'gum-treatment', name: 'علاج اللثة', category: 'periodontics', durationMin: 45, description: 'علاج التهاب اللثة ونزفها، وتنظيف الجير فوق اللثة وتحتها.' },
    { slug: 'fillings', name: 'المداواة الحافظة (الحشوات)', category: 'endodontics', durationMin: 45, description: 'إزالة التسوس وترميم السن بحشوة بلون الأسنان.' },
    { slug: 'root-canal', name: 'المداواة اللبية (علاج العصب)', category: 'endodontics', durationMin: 60, description: 'علاج عصب السن وتنظيف الأقنية وحشوها للحفاظ على السن بدل قلعه.' },
    { slug: 'zirconia-crowns', name: 'تيجان وجسور زيركون', category: 'prosthodontics', durationMin: 60, description: 'تيجان وجسور من الزيركون لتعويض الأسنان المتضررة أو المفقودة.' },
    { slug: 'porcelain-crowns', name: 'تيجان وجسور خزف', category: 'prosthodontics', durationMin: 60, description: 'تيجان وجسور خزفية لتعويض الأسنان المتضررة أو المفقودة.' },
    { slug: 'veneers', name: 'الفينير', category: 'cosmetic', durationMin: 60, description: 'قشور رقيقة تُلصق على السطح الأمامي للأسنان لتحسين اللون والشكل.' },
    { slug: 'laser-whitening', name: 'تبييض الأسنان بالليزر', category: 'cosmetic', durationMin: 60, description: 'جلسة تبييض في العيادة باستخدام الليزر.' },
    { slug: 'implants', name: 'زراعة الأسنان', category: 'implants', durationMin: 60, description: 'تعويض السن المفقود بزرعة، بعد الفحص وتقييم العظم.' },
    { slug: 'orthodontics', name: 'تقويم الأسنان', category: 'orthodontics', durationMin: 30, description: 'تقويم الأسنان مع مراجعات دورية حتى نهاية العلاج.' },
  ];
  for (const [index, s] of services.entries()) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        slug: s.slug,
        name: s.name,
        description: s.description,
        durationMin: s.durationMin,
        startingPrice: null,
        imageUrl: SERVICE_IMAGES[s.slug] ?? null,
        categoryId: categoryMap[s.category],
        sortOrder: index,
      },
    });
  }

  // ---------- الأسئلة الشائعة (من معلومات العيادة فقط) ----------
  if ((await prisma.faq.count()) === 0) {
    await prisma.faq.createMany({
      data: [
        { sortOrder: 1, question: 'أين تقع العيادة؟', answer: 'في حلب، حي العزيزية، شارع كنيسة اللاتين، فوق محل الملاك الأبيض.' },
        { sortOrder: 2, question: 'ما أوقات الدوام؟', answer: 'من الساعة 11 صباحاً حتى الساعة 6 مساءً. العطلة يوما الجمعة والأحد.' },
        { sortOrder: 3, question: 'كيف أحجز موعداً؟', answer: 'من صفحة «حجز موعد» على الموقع، أو عبر واتساب على الرقم 0944 655 028، أو على الهاتف الأرضي 2121859.' },
        { sortOrder: 4, question: 'كم تكلفة العلاج؟', answer: 'تختلف التكلفة حسب الحالة، وتُحدَّد بعد الفحص في العيادة.' },
        { sortOrder: 5, question: 'ما أنواع التيجان والجسور المتوفرة؟', answer: 'زيركون وخزف. يُحدَّد النوع المناسب لكل حالة بعد الفحص.' },
        { sortOrder: 6, question: 'هل تُجرى زراعة الأسنان في العيادة؟', answer: 'نعم. تبدأ بفحص وتقييم للعظم، ثم تُحدَّد خطة الزرع.' },
        { sortOrder: 7, question: 'كيف يتم تبييض الأسنان؟', answer: 'بالليزر داخل العيادة.' },
        { sortOrder: 8, question: 'هل يمكنني تعديل موعدي أو إلغاؤه؟', answer: 'نعم، من حسابك على الموقع أو عبر واتساب، قبل 24 ساعة من الموعد على الأقل.' },
      ],
    });
  }

  console.log('✅ تمت التهيئة.');
  if (!existingAdmin) {
    console.log('─────────────────────────────────────────────');
    console.log('حساب الدكتورة أنس (احفظه — لن يُطبع مرة أخرى):');
    console.log(`  رقم الموبايل : 0${adminPhone.slice(3)}`);
    console.log(`  كلمة المرور  : ${provided ? '(من المتغير SEED_ADMIN_PASSWORD)' : adminPassword}`);
    console.log('سيُطلب تغيير كلمة المرور عند أول تسجيل دخول.');
    console.log('─────────────────────────────────────────────');
  } else {
    console.log('الحساب موجود مسبقاً — لم تتغير كلمة المرور.');
  }
}

main()
  .catch((error) => {
    console.error('❌ فشلت التهيئة:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
