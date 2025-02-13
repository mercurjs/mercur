# Stage 1: Base image
FROM node:20-alpine AS base

# Stage 2: Builder – install Turbo and generate a pruned repo for the "backend" workspace
FROM base AS builder
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app
# Install Turbo globally (replace "^2" with your desired version if needed)
RUN yarn global add turbo@^2
# Copy the entire monorepo into the image
COPY . .
# Prune the repository for the backend workspace
RUN turbo prune backend --docker

# Stage 3: Installer – install dependencies and build the backend
FROM base AS installer
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app
# Copy pruned lockfiles and package manifests
COPY --from=builder /app/out/json/ .
# Install dependencies (this cacheable step speeds up rebuilds)
RUN yarn install --frozen-lockfile
# Copy the full source for the backend workspace
COPY --from=builder /app/out/full/ .
# Build the backend (use "--filter=backend..." to target only the backend workspace)
RUN yarn turbo run build --filter=backend...

# Stage 4: Runner – create the final production image
FROM node:20-alpine AS runner
WORKDIR /app/apps/backend

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 medusa
USER medusa

# Set production environment variable (optional but recommended)
ENV NODE_ENV=production

# Copy the built backend workspace into the image
COPY --from=installer --chown=medusa:nodejs /app/apps/backend .

# Start the Medusa backend using Yarn
RUN yarn build
RUN yarn db:migrate
CMD ["yarn", "start"]
