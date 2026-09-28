/**
 * تحديد معدّل الطلبات داخل الذاكرة — كافٍ لنسخة واحدة من التطبيق.
 * للإنتاج متعدد النسخ: استبدل المخزن بـ Redis بنفس الواجهة.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  bucket.count += 1;
  return { allowed: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count) };
}

/**
 * عنوان العميل. يُفضَّل x-real-ip الذي يضعه الخادم الوسيط (nginx) ولا يستطيع الزائر تزويره،
 * ثم آخر قيمة في x-forwarded-for (التي أضافها الوسيط) بدل الأولى القابلة للتزوير.
 */
export function clientIp(request: Request): string {
  const headers = request.headers;
  const real = headers.get('x-real-ip')?.trim();
  if (real) return real;
  const forwarded = headers.get('x-forwarded-for')?.split(',').map((v) => v.trim()).filter(Boolean);
  return forwarded?.[forwarded.length - 1] || 'unknown';
}

// تنظيف دوري للذاكرة
setInterval(() => {
  const now = Date.now();
  buckets.forEach((bucket, key) => {
    if (bucket.resetAt < now) buckets.delete(key);
  });
}, 10 * 60_000).unref?.();
