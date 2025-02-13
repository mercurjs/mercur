# === Base Stage ===
FROM node:20-alpine AS base
RUN apk update && apk add --no-cache libc6-compat

# === Builder Stage ===
FROM base AS builder
WORKDIR /app

# Install Turborepo globally. Adjust the version as needed.
RUN yarn global add turbo@^2

# Copy entire repository into the image.
COPY . .

# Prune the monorepo to include only the "medusa" workspace.
RUN turbo prune medusa --docker

# === Installer Stage ===
FROM base AS installer
WORKDIR /app

# Copy pruned dependency manifests.
COPY --from=builder /app/out/json/ .

# Install dependencies using the pruned lockfile.
RUN yarn install --frozen-lockfile

# Copy the full pruned repository for the "medusa" workspace.
COPY --from=builder /app/out/full/ .

# Build the Medusa backend.
RUN yarn turbo run build

# === Runner Stage ===
FROM base AS runner
WORKDIR /app

# Create a non-root user for security.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 medusa
USER medusa

# Copy the built assets and node_modules for the "medusa" workspace.
COPY --from=installer --chown=medusa:nodejs /app/apps/medusa/dist ./apps/medusa/dist
COPY --from=installer --chown=medusa:nodejs /app/apps/medusa/node_modules ./apps/medusa/node_modules
COPY --from=installer --chown=medusa:nodejs /app/apps/medusa/package.json ./apps/medusa/package.json

# Set the working directory to the Medusa app folder.
WORKDIR /app/apps/medusa

# Start the Medusa backend using Yarn.
CMD ["yarn", "start"]
