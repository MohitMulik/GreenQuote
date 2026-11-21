FROM node:20-alpine AS base
WORKDIR /app

# Copy root workspace manifests
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY apps/web/package.json ./apps/web/

# Install monorepo dependencies
RUN npm ci --include=dev

# Copy package source code
COPY packages/shared ./packages/shared
COPY packages/ui ./packages/ui
COPY apps/api ./apps/api

# Build shared package and API
RUN npm run build --workspace=@greenquote/shared
RUN npm run build --workspace=@greenquote/api

EXPOSE 4000
ENV NODE_ENV=production
CMD ["node", "apps/api/dist/server.js"]
