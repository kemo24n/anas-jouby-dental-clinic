import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from './env';

/**
 * تجريد التخزين: محلي أثناء التطوير، وجاهز للتحويل إلى S3 بتطبيق نفس الواجهة.
 * الملفات تُحفظ خارج مجلد public — الوصول يمر دائماً عبر مسار محمي يتحقق من الصلاحية.
 */
export interface StorageDriver {
  put(key: string, data: Buffer, mimeType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
]);

export function assertUploadAllowed(mimeType: string, sizeBytes: number) {
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new Error('نوع الملف غير مدعوم. المسموح: JPG، PNG، WEBP، PDF.');
  }
  if (sizeBytes > env.maxUploadMb * 1024 * 1024) {
    throw new Error(`حجم الملف يتجاوز الحد المسموح (${env.maxUploadMb} ميغابايت).`);
  }
}

/**
 * التحقق من محتوى الملف الفعلي (البصمة الأولى) وليس فقط النوع الذي يرسله المتصفح،
 * حتى لا يُرفع ملف HTML أو سكربت متنكّر كصورة.
 */
export function sniffMime(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  return null;
}

const EXT_FOR_MIME: Record<string, string> = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'application/pdf': '.pdf',
};

export function buildStorageKeyForMime(patientId: string, mimeType: string) {
  const safeId = patientId.replace(/[^a-zA-Z0-9-]/g, '');
  return `${safeId}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${EXT_FOR_MIME[mimeType] ?? ''}`;
}

export function buildStorageKey(patientId: string, fileName: string) {
  const ext = path.extname(fileName).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 8);
  return `${patientId}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
}

/** يحوّل المفتاح إلى مسار داخل مجلد التخزين، ويرفض أي محاولة للخروج منه. */
function safePath(key: string) {
  const root = path.resolve(process.cwd(), env.storageLocalDir);
  const full = path.resolve(root, key);
  if (!full.startsWith(root + path.sep)) throw new Error('مسار غير صالح.');
  return full;
}

const localDriver: StorageDriver = {
  async put(key, data) {
    const full = safePath(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data, { mode: 0o600 });
  },
  async get(key) {
    return fs.readFile(safePath(key));
  },
  async remove(key) {
    await fs.unlink(safePath(key)).catch(() => undefined);
  },
};

/**
 * تخزين سحابي خاص متوافق مع S3 (Supabase Storage، Cloudflare R2، AWS S3...).
 * يُستخدم على الاستضافات بلا قرص دائم (Netlify / Vercel). الحاوية يجب أن تكون خاصة (Private):
 * الملفات لا تُعرض بروابط مباشرة أبداً، بل تمر عبر مسار /api/files المحمي بالصلاحيات.
 */
let s3Client: import('@aws-sdk/client-s3').S3Client | null = null;

async function s3() {
  const sdk = await import('@aws-sdk/client-s3');
  if (!s3Client) {
    s3Client = new sdk.S3Client({
      region: process.env.STORAGE_REGION || 'auto',
      endpoint: process.env.STORAGE_ENDPOINT || undefined,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return { sdk, client: s3Client, bucket: process.env.STORAGE_BUCKET || '' };
}

function assertKey(key: string) {
  if (!/^[a-zA-Z0-9-]+\/[\w.-]+$/.test(key) || key.includes('..')) throw new Error('مسار غير صالح.');
}

const s3Driver: StorageDriver = {
  async put(key, data, mimeType) {
    assertKey(key);
    const { sdk, client, bucket } = await s3();
    await client.send(new sdk.PutObjectCommand({ Bucket: bucket, Key: key, Body: data, ContentType: mimeType }));
  },
  async get(key) {
    assertKey(key);
    const { sdk, client, bucket } = await s3();
    const result = await client.send(new sdk.GetObjectCommand({ Bucket: bucket, Key: key }));
    const bytes = await result.Body!.transformToByteArray();
    return Buffer.from(bytes);
  },
  async remove(key) {
    assertKey(key);
    const { sdk, client, bucket } = await s3();
    await client.send(new sdk.DeleteObjectCommand({ Bucket: bucket, Key: key })).catch(() => undefined);
  },
};

export const storage: StorageDriver = env.storageProvider === 's3' ? s3Driver : localDriver;
