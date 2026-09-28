import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm text-champagne-500">٤٠٤</p>
      <h1 className="mt-3 text-2xl font-semibold">الصفحة غير موجودة</h1>
      <p className="mt-3 max-w-sm text-sm leading-8 text-muted">
        الرابط الذي فتحته غير صحيح أو تم نقل الصفحة.
      </p>
      <div className="mt-7 flex gap-3">
        <Link href="/" className="inline-flex h-11 items-center rounded-xl bg-orchid-500 px-6 text-sm text-white">الرئيسية</Link>
        <Link href="/booking" className="inline-flex h-11 items-center rounded-xl border border-line px-6 text-sm">حجز موعد</Link>
      </div>
    </div>
  );
}
