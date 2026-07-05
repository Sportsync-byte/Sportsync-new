FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/sport-rules/package.json packages/sport-rules/
COPY packages/api-client/package.json packages/api-client/
COPY apps/api/package.json apps/api/
RUN npm ci -w @sportsync/api --include-workspace-root
COPY packages/shared packages/shared
COPY packages/sport-rules packages/sport-rules
COPY packages/api-client packages/api-client
COPY apps/api apps/api
RUN npm run build -w @sportsync/shared \
  && npm run build -w @sportsync/sport-rules \
  && npm run build -w @sportsync/api-client \
  && npm run build -w @sportsync/api

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/sport-rules/package.json packages/sport-rules/
COPY packages/api-client/package.json packages/api-client/
COPY apps/api/package.json apps/api/
RUN npm ci -w @sportsync/api --omit=dev --include-workspace-root
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/packages/sport-rules/dist packages/sport-rules/dist
COPY --from=build /app/packages/api-client/dist packages/api-client/dist
COPY --from=build /app/apps/api/dist apps/api/dist
EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]
