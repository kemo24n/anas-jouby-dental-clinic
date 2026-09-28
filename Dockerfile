# ---------- البناء ----------
FROM node:20-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# قيمة مؤقتة للبناء فقط — القيمة الحقيقية تأتي من .env عند التشغيل
RUN AUTH_SECRET=build-time-placeholder-not-used-at-runtime-xxxxxxxx npm run build

# ---------- التشغيل ----------
FROM node:20-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl tzdata && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 TZ=Asia/Damascus
COPY --from=build /app ./
RUN mkdir -p storage/uploads && chown -R node:node storage
USER node
EXPOSE 3000
CMD ["sh", "scripts/start.sh"]
