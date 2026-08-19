# Build context is the repository root (see docker-compose.yml).
FROM node:22-alpine AS build
WORKDIR /app
COPY tsconfig.base.json ./
COPY services/lang-service ./services/lang-service
WORKDIR /app/services/lang-service
RUN npm install --no-audit --no-fund
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/services/lang-service/dist ./dist
COPY --from=build /app/services/lang-service/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund
EXPOSE 4002
CMD ["node", "dist/server.js"]
