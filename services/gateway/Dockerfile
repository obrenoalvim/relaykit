# Build context is the repository root (see docker-compose.yml).
FROM node:22-alpine AS build
WORKDIR /app
COPY tsconfig.base.json ./
COPY services/gateway ./services/gateway
WORKDIR /app/services/gateway
RUN npm install --no-audit --no-fund
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/services/gateway/dist ./dist
COPY --from=build /app/services/gateway/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund
EXPOSE 4000
CMD ["node", "dist/server.js"]
