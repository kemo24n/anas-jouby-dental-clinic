# عيادة الدكتورة أنس جوبي لطب الأسنان — الموقع ونظام إدارة العيادة

موقع عربي (RTL) مع نظام إدارة كامل لعيادة الدكتورة أنس جوبي في العزيزية، حلب:

- **الموقع العام:** الرئيسية، عن الطبيبة، العلاجات، الأسئلة الشائعة، التواصل، والحجز الإلكتروني حسب الأوقات المتاحة فعلاً.
- **لوحة التحكم** للدكتورة أنس (حساب إداري واحد): المواعيد، المرضى، التاريخ الطبي والسني، مخطط الأسنان، الحالات، خطط العلاج، المدفوعات، الملفات والأشعة، الرسائل، حسابات المرضى، التقارير، والإعدادات — مع إمكانية حذف أي شيء.
- **بوابة المريض:** مواعيده، خطة علاجه، مستنداته، والتواصل مع العيادة.
- **الدخول برقم الموبايل** بصيغة 09XXXXXXXX (للدكتورة وللمرضى) — بدون +963 وبدون بريد إلكتروني.

### الحسابات

| الحساب | كيف يُنشأ |
|---|---|
| الدكتورة أنس (مدير) | مرة واحدة عند `npm run setup` — رقم الموبايل من `SEED_ADMIN_PHONE` (افتراضياً 0944655028) |
| المرضى | ينشئون حساباتهم من الموقع (رقم الموبايل + كلمة مرور)، أو تنشئها الدكتورة من «حسابات المرضى» لمريض مسجّل |

لا توجد حسابات للموظفين. المريض الذي ينسى كلمة المرور تعيد الدكتورة تعيينها من «حسابات المرضى» وتعطيه كلمة مؤقتة.

تصميم وتطوير: **Solunera** — Kamel Nassif — [@soluneragency](https://instagram.com/soluneragency)

---

## معلومات العيادة المعتمدة في النظام

| البند | القيمة |
|---|---|
| الطبيبة | د. أنس جوبي — طبيبة أسنان ومحاضِرة في كلية طب الأسنان، خبرة 35 سنة |
| العنوان | حلب، العزيزية، شارع كنيسة اللاتين، فوق محل الملاك الأبيض |
| الهاتف الأرضي | 021 212 1859 |
| موبايل / واتساب | 0944 655 028 |
| الدوام | 11 صباحاً – 6 مساءً، العطلة الجمعة والأحد |
| العلاجات | اللثة، المداواة الحافظة واللبية، الزرع، تيجان وجسور زيركون وخزف، الفينير، تبييض بالليزر، التقويم |
| الألوان | وردي فاتح (زهر) وبيج |

كل هذه البيانات قابلة للتعديل من **لوحة التحكم ← إعدادات العيادة** و **الخدمات** و **ساعات الدوام**، دون تعديل الكود.

النظام يبدأ فارغاً تماماً: لا مرضى، ولا مواعيد، ولا مدفوعات، ولا رسائل، ولا آراء مرضى، ولا حسابات غير حساب الدكتورة. ما يُدخل مسبقاً هو محتوى الموقع فقط (بيانات العيادة، الخدمات، الأسئلة الشائعة، ساعات الدوام) وكله قابل للتعديل أو الحذف من لوحة التحكم.

---

## النشر المجاني: Netlify + Supabase

- **Supabase** (مجاني): قاعدة البيانات + تخزين خاص لملفات المرضى. أنشئ حاوية Storage خاصة باسم `patient-files`، وأنشئ مفاتيح S3 من Storage ← Settings.
- **Netlify** (مجاني، يسمح بالاستخدام التجاري): اربط مستودع GitHub، والبناء (`netlify.toml`) يُنشئ الجداول وحساب الدكتورة تلقائياً.
- المتغيرات على Netlify: `DATABASE_URL` (Session pooler من Supabase + `?connection_limit=1`)، `AUTH_SECRET`، `SEED_ADMIN_PHONE`، `SEED_ADMIN_PASSWORD`، `NEXT_PUBLIC_APP_URL`، `STORAGE_PROVIDER=s3`، `STORAGE_BUCKET`، `STORAGE_REGION`، `STORAGE_ENDPOINT`، `STORAGE_ACCESS_KEY_ID`، `STORAGE_SECRET_ACCESS_KEY`، `MAX_UPLOAD_MB=5`.
- التوقيت مضبوط داخل الكود على Asia/Damascus، فالمواعيد صحيحة حتى على خوادم UTC.

## النشر على Railway (الأسهل — بدون خادم)

1. أنشئ حساباً على https://railway.app
2. من مجلد المشروع في PowerShell:
   ```
   npm i -g @railway/cli
   railway login
   railway init
   railway up
   ```
3. في لوحة Railway: **+ New ← Database ← PostgreSQL**.
4. في خدمة التطبيق ← **Variables** أضف:
   `DATABASE_URL=${{Postgres.DATABASE_URL}}` · `AUTH_SECRET` · `SEED_ADMIN_PASSWORD` · `TZ=Asia/Damascus` · `RAILWAY_RUN_UID=0` · `NEXT_PUBLIC_APP_URL`
5. **Settings ← Networking ← Generate Domain**، ثم ضع الرابط في `NEXT_PUBLIC_APP_URL`.
6. أضف Volume على المسار `/app/storage/uploads` لحفظ ملفات المرضى.

عند كل تشغيل يُحدَّث مخطط قاعدة البيانات تلقائياً، والتهيئة الأولى (حساب الدكتورة + محتوى الموقع) تتم مرة واحدة فقط.

## التشغيل على خادم (VPS) — الطريقة الموصى بها

المتطلبات: خادم Linux عليه Docker و nginx، ونطاق (دومين) يشير إلى الخادم.

```bash
# 1) رفع المشروع إلى الخادم ثم:
cd anas-jouby-dental-clinic
cp .env.example .env

# 2) تعديل .env — القيم الإلزامية:
#    AUTH_SECRET          ← openssl rand -base64 48
#    POSTGRES_PASSWORD    ← كلمة مرور قوية لقاعدة البيانات
#    NEXT_PUBLIC_APP_URL  ← https://your-domain.com
#    SEED_ADMIN_PHONE     ← رقم موبايل الدكتورة للدخول (افتراضياً 0944655028)
nano .env

# 3) البناء والتشغيل
docker compose up -d --build

# 4) أول مرة فقط: إنشاء الجداول وإدخال بيانات العيادة والحسابين
docker compose exec app npm run setup
#    ← يطبع رقم الدخول وكلمة مرور مؤقتة لحساب الدكتورة. احفظها.
#    ← عند أول دخول سيُطلب تغيير كلمة المرور إجبارياً.
```

### إعداد nginx مع HTTPS

```nginx
server {
    server_name your-domain.com;
    client_max_body_size 12m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;          # ضروري لحماية تسجيل الدخول من التخمين
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }
}
```

ثم: `sudo certbot --nginx -d your-domain.com` لتفعيل HTTPS.

### النسخ الاحتياطي (مهم — بيانات طبية)

```bash
# نسخة يومية لقاعدة البيانات
docker compose exec -T db pg_dump -U dental anas_dental | gzip > backup-$(date +%F).sql.gz
# الملفات المرفوعة (الأشعة والمستندات) موجودة في المجلد: dental_uploads (Docker volume)
```

يُنصح بجدولة النسخة عبر `cron` وحفظها خارج الخادم.

---

## التشغيل المحلي للتطوير

```bash
npm install
cp .env.example .env          # عدّل DATABASE_URL و AUTH_SECRET
docker compose up -d db       # قاعدة البيانات فقط
npm run setup                 # الجداول + بيانات العيادة
npm run dev                   # http://localhost:3000
```

أوامر أخرى: `npm run typecheck` · `npm run test` · `npm run lint` · `npm run build` · `npm run db:studio`

---

## الأمان

- **الجلسات:** رمز JWT موقّع في كوكي `HttpOnly` + `SameSite` + `Secure` (في الإنتاج). يُتحقق من كل جلسة مقابل قاعدة البيانات في كل طلب، فإيقاف الحساب أو تغيير الدور أو كلمة المرور أو تسجيل الخروج يُبطل الجلسة فوراً على كل الأجهزة.
- **كلمات المرور:** bcrypt (12 جولة). الحسابات الأولى بكلمات عشوائية قوية، مع **إجبار** على تغييرها قبل الوصول لأي بيانات (مطبّق على الخادم وليس في الواجهة فقط).
- **منع التخمين:** حد لمحاولات الدخول لكل عنوان IP ولكل رقم، وزمن استجابة متساوٍ حتى لا يُعرف إن كان الرقم مسجلاً.
- **الصلاحيات:** كل مسار API يتحقق من الدور على الخادم. الدكتورة وحدها تدخل لوحة التحكم، والمريض يرى ملفه فقط.
- **حماية السجلات:** إنشاء حساب مريض جديد لا يُربط تلقائياً بملف موجود بنفس رقم الهاتف (كي لا يطّلع أحد على سجل غيره بمجرد معرفة رقمه). الحجز العام لا يكشف اسم صاحب الرقم.
- **CSRF:** رفض أي طلب كتابة قادم من موقع آخر.
- **رفع الملفات:** فحص محتوى الملف الفعلي (JPG/PNG/WEBP/PDF فقط)، أسماء تخزين عشوائية، الملفات خارج المجلد العام، والتنزيل عبر مسار محمي بصلاحيات وبترويسات `sandbox`.
- **ترويسات الأمان:** Content-Security-Policy، HSTS، X-Frame-Options، nosniff، Referrer-Policy، Permissions-Policy. لا تخزين مؤقت لصفحات لوحة التحكم والبوابة.
- **سجل التدقيق:** كل دخول، واطلاع على ملف مريض، وتعديل، وحذف يُسجَّل مع المستخدم والوقت.
- **الاعتماديات:** Next.js 15.5 و React 19 — `npm audit` بدون أي ثغرات معروفة.
- **الخصوصية:** الخط والصور مستضافة محلياً، بدون طلبات لجهات خارجية (باستثناء خريطة OpenStreetMap في صفحتي الرئيسية والتواصل).

---

## ما يمكن إضافته لاحقاً

| البند | طريقة الإضافة |
|---|---|
| صورة شخصية للطبيبة | ضعها في `public/images/doctor.jpg` ثم من قاعدة البيانات: حقل `photoUrl` للطبيبة = `/images/doctor.jpg` |
| صور قبل/بعد (التبييض والتقويم) | ضع الصور في `public/images/` وأضفها إلى `GALLERY` في `lib/media.ts` |
| الموقع الدقيق على الخريطة | لوحة التحكم ← إعدادات العيادة: خط العرض والطول ورابط خرائط جوجل (حالياً مضبوط على حي العزيزية) |
| الأسعار | لوحة التحكم ← الخدمات (تظهر "تبدأ من" تلقائياً عند إدخال سعر) |
| حسابات التواصل الاجتماعي | لوحة التحكم ← إعدادات العيادة |

---

## English summary

Arabic-first (RTL) website + clinic management platform for **Dr. Anas Jouby's dental clinic** (Al-Aziziyah, Aleppo). Next.js 15 · React 19 · TypeScript · Tailwind · PostgreSQL · Prisma.

**Accounts:** one admin (Dr. Anas) + patients. Everyone logs in with a Syrian mobile number (09XXXXXXXX). The system starts empty (no patients, appointments, payments or demo accounts); the doctor can delete any record, and manage/reset/delete patient accounts.

**Deploy:** `cp .env.example .env` → set `AUTH_SECRET`, `POSTGRES_PASSWORD`, `NEXT_PUBLIC_APP_URL`, `SEED_ADMIN_PHONE` → `docker compose up -d --build` → `docker compose exec app npm run setup` (prints a one-time password for the doctor; change forced on first login). Put nginx + certbot in front and forward `X-Real-IP`.

**Security:** DB-validated JWT sessions with server-side revocation (token versioning), forced first-login password change, per-IP and per-account login throttling with constant-time responses, server-enforced roles (admin vs. patient), no auto-linking of self-registered accounts to existing patient records, CSRF origin checks, magic-byte upload validation with sandboxed downloads, strict CSP/HSTS headers, audit log, zero known `npm audit` vulnerabilities.

Designed & developed by **Solunera** — Kamel Nassif — [@soluneragency](https://instagram.com/soluneragency)
