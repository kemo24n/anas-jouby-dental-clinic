import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm text-champagne-500">٤٠٣</p>
      <h1 className="mt-3 text-2xl font-semibold">لا يمكنك الوصول إلى هذه الصفحة</h1>
      <p className="mt-3 max-w-sm text-sm leading-8 text-muted">
        حسابك لا يملك صلاحية عرض هذا القسم. إن كنت تعتقد أن هذا خطأ، تواصل مع العيادة.
      </p>
      <Link href="/" className="mt-7 inline-flex h-11 items-center rounded-xl bg-orchid-500 px-6 text-sm text-white">
        العودة للرئيسية
      </Link>
    </div>
  );
}
