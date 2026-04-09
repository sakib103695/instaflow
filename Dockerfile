# syntax=docker/dockerfile:1.7
#
# Multi-stage Next.js Dockerfile.
#
# Stage 1 (deps)    : install pnpm deps from lockfile (cached layer)
# Stage 2 (builder) : build the Next.js app with `output: 'standalone'`
# Stage 3 (runner)  : minimal runtime image — just node, the standalone build,
#                     the static assets, and the public dir.
#
# Final image is ~150MB and runs as a non-root user.

ARG NODE_VERSION=20-alpine

# ===== Stage 1: deps =====
FROM node:${NODE_VERSION} AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ===== Stage 2: builder =====
FROM node:${NODE_VERSION} AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# We bake NEXT_PUBLIC_* env vars into the build because Next inlines them.
# Server-only secrets are NOT baked — they come from runtime env via compose.
ARG NEXT_PUBLIC_VAPI_PUBLIC_KEY
ENV NEXT_PUBLIC_VAPI_PUBLIC_KEY=${NEXT_PUBLIC_VAPI_PUBLIC_KEY}

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ===== Stage 3: runner =====
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a non-root user.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy only what the standalone build needs.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
