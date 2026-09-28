const isDev = process.env.NODE_ENV !== 'production';

// سياسة أمان المحتوى: لا سكربتات أو إطارات من مصادر خارجية غير معروفة
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob:",
  // فيديو الواجهة من Mixkit فقط
  "media-src 'self' https://assets.mixkit.co",
  "frame-src https://www.openstreetmap.org",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // standalone لـ Docker فقط؛ Netlify و Vercel يديران البناء بأنفسهما
  ...(process.env.NETLIFY || process.env.VERCEL ? {} : { output: 'standalone' }),
  images: {
    // الصور كلها محلية — لا مصادر خارجية (يمنع إساءة استخدام محسّن الصور)
    remotePatterns: [],
  },
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          ...(isDev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]),
        ],
      },
      {
        // لا تخزين مؤقت لأي صفحة أو استجابة تحتوي بيانات خاصة
        source: '/(dashboard|portal|api)/:path*',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
    ];
  },
};

export default nextConfig;
