import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE = process.env.AUTH_COOKIE_NAME || 'anas_dental_session';
const ISSUER = 'anas-jouby-dental';

/**
 * خط الدفاع الأول على الحافة:
 *  1. حماية طلبات الكتابة على /api من مواقع أخرى (CSRF) بمطابقة Origin مع النطاق.
 *  2. إعادة توجيه غير المسجّلين عن لوحة التحكم وبوابة المريض.
 * التحقق الكامل (صلاحية الرمز في قاعدة البيانات والأدوار) يتم في كل مسار على الخادم.
 */
async function readSession(token?: string) {
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret || secret.length < 32) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { issuer: ISSUER, algorithms: ['HS256'] });
    return payload as { sub?: string; role?: string };
  } catch {
    return null;
  }
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  if (!origin) {
    // المتصفحات الحديثة ترسل Origin مع كل طلب كتابة؛ نقبل غيابه فقط إن كان الطلب من الموقع نفسه حسب Sec-Fetch-Site
    const site = request.headers.get('sec-fetch-site');
    return !site || site === 'same-origin' || site === 'none';
  }
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/')) {
    if (!SAFE_METHODS.has(request.method) && !sameOrigin(request)) {
      return NextResponse.json({ ok: false, error: 'طلب مرفوض.' }, { status: 403 });
    }
    return NextResponse.next();
  }

  const session = await readSession(request.cookies.get(COOKIE)?.value);

  const isDashboard = pathname.startsWith('/dashboard');
  const isPortal = pathname.startsWith('/portal');

  if ((isDashboard || isPortal) && !session) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isDashboard && session?.role === 'PATIENT') {
    return NextResponse.redirect(new URL('/portal', request.url));
  }

  if (isPortal && session && session.role !== 'PATIENT') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/portal/:path*'],
};
