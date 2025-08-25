FROM node:20-alpine AS base

FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /server

# Copy everything and let turbo prune handle the optimization
COPY . .

# Install dependencies including turbo
RUN yarn install

# Prune the monorepo for the api package
RUN yarn turbo prune api --docker

FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /server

# First install the pruned dependencies
COPY --from=builder /server/out/json/ .
COPY --from=builder /server/out/yarn.lock ./yarn.lock
RUN yarn install --frozen-lockfile

# Build the project and its dependencies
COPY --from=builder /server/out/full/ .
RUN yarn turbo build --filter=api...

FROM base AS runner
WORKDIR /server

# Don't run production as root
RUN addgroup --system --gid 1001 medusa
RUN adduser --system --uid 1001 medusa

# Ensure the medusa user owns the backend folder
RUN mkdir -p /server/apps/backend/static
RUN chown -R medusa:medusa /server/apps/backend

USER medusa
COPY --from=installer /server .

WORKDIR /server/apps/backend

#RUN yarn db:migrate

CMD ["yarn", "start"]
