FROM node:20-alpine AS base

# Backend build
FROM base AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/tsconfig.json ./
RUN npm ci
COPY backend/prisma ./prisma
RUN npx prisma generate
COPY backend/src ./src
RUN npm run build

# Frontend build
FROM base AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/tsconfig.json frontend/next.config.js frontend/tailwind.config.ts frontend/postcss.config.js ./
RUN npm ci
COPY frontend/src ./src
COPY frontend/public ./public
RUN npm run build

# Production
FROM base AS production
WORKDIR /app

COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/backend/package.json ./backend/package.json
COPY --from=backend-build /app/backend/prisma ./backend/prisma

COPY --from=frontend-build /app/frontend/.next ./frontend/.next
COPY --from=frontend-build /app/frontend/public ./frontend/public
COPY --from=frontend-build /app/frontend/package.json ./frontend/package.json
COPY --from=frontend-build /app/frontend/node_modules ./frontend/node_modules

COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh

EXPOSE 5000 3000

CMD ["./docker-entrypoint.sh"]
