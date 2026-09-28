// يُنفَّذ مرة واحدة عند تشغيل الخادم — يثبّت توقيت العيادة قبل أي طلب
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./lib/timezone');
  }
}
