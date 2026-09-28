#!/bin/sh
# تشغيل الإنتاج: تحديث جداول قاعدة البيانات، ثم التهيئة الأولى (مرة واحدة فقط)، ثم الخادم.
set -e
npx prisma db push --skip-generate
npx tsx prisma/seed.ts
exec node .next/standalone/server.js
