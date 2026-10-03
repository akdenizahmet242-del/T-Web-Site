# syntax=docker/dockerfile:1.7
# Üretim imajı: Next.js standalone çıktısı (≈ 150 MB, yalnızca çalışma zamanı dosyaları).
#
#   docker compose --profile app up --build
#
ARG NODE_VERSION=22-alpine

# --- 1) Bağımlılıklar ----------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
# postinstall → prisma generate (DATABASE_URL gerekmez)
RUN npm ci

# --- 2) Build ------------------------------------------------------------------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY --from=deps /app/src/generated ./src/generated
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_OUTPUT=standalone
# NEXT_PUBLIC_* değerleri build anında pakete gömülür
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_GTM_ID=""
ARG NEXT_PUBLIC_META_PIXEL_ID=""
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID \
    NEXT_PUBLIC_META_PIXEL_ID=$NEXT_PUBLIC_META_PIXEL_ID
RUN npm run build

# --- 3) Migration/seed yardımcı imajı (compose "migrate" servisi) ---------------
FROM builder AS migrator
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]

# --- 4) Çalışma zamanı -----------------------------------------------------------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    STORAGE_LOCAL_DIR=/app/storage
RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs \
 && mkdir -p /app/storage && chown nextjs:nodejs /app/storage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:3000/robots.txt >/dev/null || exit 1
CMD ["node", "server.js"]
