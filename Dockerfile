# syntax=docker/dockerfile:1
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency files and the Turbo configuration
COPY package.json yarn.lock turbo.json ./

# Install all dependencies (this installs workspaces as well)
RUN yarn install --frozen-lockfile

# Copy the complete project
COPY . .

# Run the build (which runs "turbo run build")
RUN yarn build

# Stage 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Set to production mode
ENV NODE_ENV=production

# Copy only what's needed from the builder stage.
# In this example, we focus on the backend app.
COPY --from=builder /app/apps/backend/package.json apps/backend/package.json
COPY --from=builder /app/apps/backend/dist apps/backend/dist
COPY --from=builder /app/node_modules node_modules

WORKDIR /app/apps/backend

# Expose the port on which your Medusa API listens (adjust if needed)
EXPOSE 9000

# Run the application using the start script (which calls "medusa start --types=false")
CMD ["yarn", "start"]
