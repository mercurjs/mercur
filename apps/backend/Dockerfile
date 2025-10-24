FROM node:20-alpine AS base

# The web Dockerfile is copy-pasted into our main docs at /docs/handbook/deploying-with-docker.
# Make sure you update this Dockerfile, the Dockerfile in the web workspace and copy that over to Dockerfile in the docs.

# Accept build arguments for environment variables
ARG ADMIN_CORS
ARG ALGOLIA_API_KEY
ARG ALGOLIA_APP_ID
ARG AUTH_CORS
ARG BACKEND_URL
ARG DATABASE_URL
ARG NODE_ENV
ARG S3_ACCESS_KEY_ID
ARG S3_BUCKET
ARG S3_ENDPOINT
ARG S3_FILE_URL
ARG S3_REGION
ARG S3_SECRET_ACCESS_KEY
ARG STORE_CORS
ARG STOREFRONT_URL
ARG STRIPE_CONNECTED_ACCOUNTS_WEBHOOK_SECRET
ARG STRIPE_SECRET_API_KEY
ARG TALK_JS_APP_ID
ARG TALK_JS_SECRET_API_KEY
ARG VENDOR_CORS
ARG VENDOR_PANEL_URL
ARG VITE_TALK_JS_APP_ID
ARG VITE_TALK_JS_SECRET_API_KEY

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
RUN yarn global add turbo

# Set environment variables from build args
ENV ADMIN_CORS=$ADMIN_CORS
ENV ALGOLIA_API_KEY=$ALGOLIA_API_KEY
ENV ALGOLIA_APP_ID=$ALGOLIA_APP_ID
ENV AUTH_CORS=$AUTH_CORS
ENV BACKEND_URL=$BACKEND_URL
ENV DATABASE_URL=$DATABASE_URL
ENV NODE_ENV=$NODE_ENV
ENV S3_ACCESS_KEY_ID=$S3_ACCESS_KEY_ID
ENV S3_BUCKET=$S3_BUCKET
ENV S3_ENDPOINT=$S3_ENDPOINT
ENV S3_FILE_URL=$S3_FILE_URL
ENV S3_REGION=$S3_REGION
ENV S3_SECRET_ACCESS_KEY=$S3_SECRET_ACCESS_KEY
ENV STORE_CORS=$STORE_CORS
ENV STOREFRONT_URL=$STOREFRONT_URL
ENV STRIPE_CONNECTED_ACCOUNTS_WEBHOOK_SECRET=$STRIPE_CONNECTED_ACCOUNTS_WEBHOOK_SECRET
ENV STRIPE_SECRET_API_KEY=$STRIPE_SECRET_API_KEY
ENV TALK_JS_APP_ID=$TALK_JS_APP_ID
ENV TALK_JS_SECRET_API_KEY=$TALK_JS_SECRET_API_KEY
ENV VENDOR_CORS=$VENDOR_CORS
ENV VENDOR_PANEL_URL=$VENDOR_PANEL_URL
ENV VITE_TALK_JS_APP_ID=$VITE_TALK_JS_APP_ID
ENV VITE_TALK_JS_SECRET_API_KEY=$VITE_TALK_JS_SECRET_API_KEY

# First install dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
RUN yarn install

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .

# Uncomment and use build args to enable remote caching
# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM

# ARG TURBO_TOKEN
# ENV TURBO_TOKEN=$TURBO_TOKEN

# Build the API
WORKDIR /app/apps/backend
RUN yarn build

FROM base AS runner
WORKDIR /app

# Set environment variables from build args
ENV ADMIN_CORS=$ADMIN_CORS
ENV ALGOLIA_API_KEY=$ALGOLIA_API_KEY
ENV ALGOLIA_APP_ID=$ALGOLIA_APP_ID
ENV AUTH_CORS=$AUTH_CORS
ENV BACKEND_URL=$BACKEND_URL
ENV DATABASE_URL=$DATABASE_URL
ENV NODE_ENV=$NODE_ENV
ENV S3_ACCESS_KEY_ID=$S3_ACCESS_KEY_ID
ENV S3_BUCKET=$S3_BUCKET
ENV S3_ENDPOINT=$S3_ENDPOINT
ENV S3_FILE_URL=$S3_FILE_URL
ENV S3_REGION=$S3_REGION
ENV S3_SECRET_ACCESS_KEY=$S3_SECRET_ACCESS_KEY
ENV STORE_CORS=$STORE_CORS
ENV STOREFRONT_URL=$STOREFRONT_URL
ENV STRIPE_CONNECTED_ACCOUNTS_WEBHOOK_SECRET=$STRIPE_CONNECTED_ACCOUNTS_WEBHOOK_SECRET
ENV STRIPE_SECRET_API_KEY=$STRIPE_SECRET_API_KEY
ENV TALK_JS_APP_ID=$TALK_JS_APP_ID
ENV TALK_JS_SECRET_API_KEY=$TALK_JS_SECRET_API_KEY
ENV VENDOR_CORS=$VENDOR_CORS
ENV VENDOR_PANEL_URL=$VENDOR_PANEL_URL
ENV VITE_TALK_JS_APP_ID=$VITE_TALK_JS_APP_ID
ENV VITE_TALK_JS_SECRET_API_KEY=$VITE_TALK_JS_SECRET_API_KEY

# Don't run production as root
RUN addgroup --system --gid 1001 medusa
RUN adduser --system --uid 1001 medusa

# Ensure the medusa user owns the backend folder
RUN mkdir -p /app/apps/backend/static
RUN chown -R medusa:medusa /app/apps/backend

USER medusa

# Copy built application from installer stage
COPY --from=installer /app/apps/backend/.medusa/server ./
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/backend/package.json ./package.json

# Copy necessary config files
COPY --from=installer /app/apps/backend/medusa-config.ts ./medusa-config.ts
COPY --from=installer /app/apps/backend/tsconfig.json ./tsconfig.json

WORKDIR /app

CMD ["yarn", "start"]