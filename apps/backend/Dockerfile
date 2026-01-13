FROM node:24-alpine AS base

# The web Dockerfile is copy-pasted into our main docs at /docs/handbook/deploying-with-docker.
# Make sure you update this Dockerfile, the Dockerfile in the web workspace and copy that over to Dockerfile in the docs.

FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk update
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app
RUN yarn global add turbo
COPY . .
RUN turbo prune api --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

# First install dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
RUN yarn install

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .

RUN yarn turbo build

FROM base AS runner
WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Don't run production as root
RUN addgroup --system --gid 1001 medusa
RUN adduser --system --uid 1001 medusa

# Ensure the medusa user owns the backend folder
RUN mkdir -p /app/apps/backend/static
RUN chown -R medusa:medusa /app/apps/backend

USER medusa
COPY --from=installer --chown=medusa:medusa /app .

WORKDIR /app/apps/backend

EXPOSE 9000

# Run migrations, optionally seed demo data (controlled by SEED_DEMO_DATA env), and start server
# MIGRATE_LINKS options: "safe" (default), "skip", "all"
# - safe: auto-creates new links, skips deletions (recommended for most users)
# - skip: ignores all link operations
# - all: auto-executes all link operations including deletions (use with caution)
CMD ["sh", "-c", "case \"$MIGRATE_LINKS\" in skip) LINK_FLAG='--skip-links';; all) LINK_FLAG='--execute-all-links';; *) LINK_FLAG='--execute-safe-links';; esac && yarn db:migrate $LINK_FLAG && if [ \"$SEED_DEMO_DATA\" = \"true\" ]; then yarn seed || true; fi && yarn start"]