FROM node:24-alpine AS base
WORKDIR /usr/src/app

RUN npm install -g pnpm

FROM base AS install
RUN mkdir -p /temp/dev /temp/prod

COPY package.json pnpm-lock.yaml /temp/dev/
RUN cd /temp/dev && pnpm install --frozen-lockfile

COPY package.json pnpm-lock.yaml /temp/prod/
RUN cd /temp/prod && pnpm install --frozen-lockfile --prod

FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ENV NODE_ENV=production
# Need this for adapter-auto to use node.js.
ENV GCP_BUILDPACKS=true

RUN pnpm run build

FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules

COPY --from=prerelease /usr/src/app/build ./build
COPY --from=prerelease /usr/src/app/migrations ./migrations
COPY --from=prerelease /usr/src/app/package.json ./package.json
COPY --from=prerelease /usr/src/app/drizzle.config.ts ./drizzle.config.ts

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000
ENV PORT=3000

ENTRYPOINT ["node", "build/index.js"]
