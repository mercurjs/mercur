# BUILD STAGE
FROM node:24-alpine AS build
WORKDIR /build

# Build arguments - automatically populated from .env via docker-compose
ARG VITE_MEDUSA_BASE
ARG VITE_MEDUSA_BACKEND_URL
ARG VITE_MEDUSA_STOREFRONT_URL
ARG VITE_PUBLISHABLE_API_KEY
ARG VITE_TALK_JS_APP_ID
ARG VITE_DISABLE_SELLERS_REGISTRATION
ARG VITE_MEDUSA_PROJECT

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code (includes .env which will be used for build)
COPY . .

# Build the application
RUN yarn build:preview

# RUNTIME STAGE
FROM node:24-alpine AS runtime

# Install serve globally
RUN npm install -g serve

# Copy built files
COPY --from=build /build/dist /app

WORKDIR /app

EXPOSE 7000

# Serve static files
CMD ["serve", "-s", ".", "-l", "7000"]
