/** قراءة متغيرات البيئة بشكل آمن — لا تُستخدم الأسرار إلا على الخادم. */
function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`متغير البيئة ${name} غير معرّف. راجع ملف .env.example`);
  return value;
}

export const env = {
  databaseUrl: () => required('DATABASE_URL'),
  authSecret: () => required('AUTH_SECRET'),
  cookieName: process.env.AUTH_COOKIE_NAME || 'anas_dental_session',
  sessionMaxAge: Number(process.env.SESSION_MAX_AGE_SECONDS || 43200),
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  storageProvider: (process.env.STORAGE_PROVIDER || 'local') as 'local' | 's3',
  storageLocalDir: process.env.STORAGE_LOCAL_DIR || './storage/uploads',
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 10),
  notificationsDriver: process.env.NOTIFICATIONS_DRIVER || 'database',
  isProduction: process.env.NODE_ENV === 'production',
};

/** رقم واتساب العيادة — متاح للواجهة، وهو رقم عمل وليس بيانات مريض. */
export const PUBLIC_WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '963944655028';
