// نسخ الملفات الثابتة إلى مجلد standalone بعد البناء — يعمل على Windows و Linux و Mac
import { cpSync, existsSync } from 'node:fs';

if (existsSync('.next/standalone')) {
  cpSync('public', '.next/standalone/public', { recursive: true });
  cpSync('.next/static', '.next/standalone/.next/static', { recursive: true });
}
