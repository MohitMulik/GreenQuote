FROM node:20-alpine AS base
WORKDIR /app

# Copy root workspace manifests
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
COPY apps/web/package.json ./apps/web/

# Install monorepo dependencies
RUN npm ci --include=dev

# Copy package source code
COPY packages/shared ./packages/shared
COPY packages/ui ./packages/ui
COPY apps/web ./apps/web

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=

# Build shared library and Next.js web application
RUN npm run build --workspace=@greenquote/shared
RUN npm run build --workspace=@greenquote/ui
RUN npm run build --workspace=@greenquote/web

EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=@greenquote/web"]
