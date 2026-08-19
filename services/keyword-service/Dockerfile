# Build context is the repository root (see docker-compose.yml).
FROM node:22-alpine AS build
WORKDIR /app
COPY tsconfig.base.json ./
COPY services/keyword-service ./services/keyword-service
WORKDIR /app/services/keyword-service
RUN npm install --no-audit --no-fund
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/services/keyword-service/dist ./dist
COPY --from=build /app/services/keyword-service/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund
EXPOSE 4003
CMD ["node", "dist/server.js"]
