# ── Stage 1: Build React app ───────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency manifests first (cache layer)
COPY package.json package-lock.json* ./

# Install dependencies, skip postinstall (electron scripts removed)
RUN npm ci --ignore-scripts

# Copy source
COPY . .

# VITE_API_BASE_URL="" means all /api/* calls are relative → handled by Nginx proxy
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ── Stage 2: Serve with Nginx ──────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config (with API reverse proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
