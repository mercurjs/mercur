# Benchmark image: a pure consumer of the published @mercurjs/* packages, so the
# number under test is a released version, not a workspace build.
#
#   docker build -f benchmarks/docker/Dockerfile \
#     --build-arg MERCUR_VERSION=2.3.8-canary.4 \
#     --build-arg MEDUSA_VERSION=2.21.2 \
#     -t mercur-bench-api .
#
# Build context is the repo root.

FROM node:22-bookworm-slim AS build
ARG MERCUR_VERSION
ARG MEDUSA_VERSION=2.21.2
RUN test -n "$MERCUR_VERSION" || (echo "MERCUR_VERSION build-arg is required" && exit 1)
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ ca-certificates curl unzip \
  && rm -rf /var/lib/apt/lists/*
RUN npm i -g corepack && corepack enable && corepack prepare yarn@4.15.0 --activate

WORKDIR /app
COPY benchmarks/docker/api/ ./
RUN sed -i "s/MERCUR_VERSION/${MERCUR_VERSION}/g; s/MEDUSA_VERSION/${MEDUSA_VERSION}/g" package.json \
  && touch yarn.lock \
  && printf 'nodeLinker: node-modules\n' > .yarnrc.yml \
  && yarn install --mode=skip-build
RUN yarn build \
  && cd .medusa/server \
  && touch yarn.lock \
  && printf 'nodeLinker: node-modules\n' > .yarnrc.yml \
  && yarn install --mode=skip-build

FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/.medusa/server ./
COPY --from=build /app/src/scripts ./src/scripts
EXPOSE 9000
CMD ["npx", "medusa", "start"]
