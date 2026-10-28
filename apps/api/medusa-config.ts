import { loadEnv } from '@medusajs/framework/utils'
import { withMercur } from '@mercurjs/core'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

module.exports = withMercur({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      vendorCors: process.env.VENDOR_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  featureFlags: {
    seller_registration: true
  },
  plugins: [
    {
      resolve: '@mercurjs/stripe-connector-plugin',
      options: {
        apiKey: STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_SELLERS_WEBHOOK_SECRET,
        alerting: {
          technicalEmail: process.env.PAYOUT_ALERT_EMAIL,
          from: process.env.PAYOUT_ALERT_FROM,
        },
      },
    },
  ],
  modules: [
    ...(STRIPE_SECRET_KEY
      ? [
          {
            resolve: '@medusajs/medusa/payment',
            options: {
              providers: [
                {
                  resolve: '@mercurjs/stripe-connector-plugin/providers/payment-stripe',
                  id: 'stripe',
                  options: {
                    apiKey: STRIPE_SECRET_KEY,
                    webhookSecret: process.env.STRIPE_OPERATOR_WEBHOOK_SECRET,
                  },
                },
              ],
            },
          },
          {
            resolve: '@mercurjs/core/modules/payout',
            options: {
              providers: [
                {
                  resolve: '@mercurjs/stripe-connector-plugin/providers/payout-stripe-connect',
                  id: 'stripe',
                  options: {
                    apiKey: STRIPE_SECRET_KEY,
                    webhookSecret: process.env.STRIPE_SELLERS_WEBHOOK_SECRET,
                    manualPayouts: true,
                  },
                },
              ],
              onboarding: {
                returnUrl: `${process.env.VENDOR_URL || 'http://localhost:7001'}/stripe`,
                refreshBaseUrl: process.env.BACKEND_URL || 'http://localhost:9000',
              },
            },
          },
        ]
      : []),
    {
      resolve: '@mercurjs/core/modules/admin-ui',
      options: {
        appDir: '../admin-test',
        path: '/',
        disable: true
      }
    },
    {
      resolve: '@mercurjs/core/modules/vendor-ui',
      options: {
        appDir: '../vendor',
        path: '/',
        disable: true
      }
    },
    {
      resolve: '@medusajs/medusa/cache-redis',
      options: { redisUrl: REDIS_URL },
    },
    {
      resolve: '@medusajs/medusa/event-bus-redis',
      options: { redisUrl: REDIS_URL },
    },
    {
      resolve: '@medusajs/medusa/workflow-engine-redis',
      options: { redis: { url: REDIS_URL } },
    },
    {
      resolve: '@medusajs/medusa/locking',
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/locking-redis',
            id: 'locking-redis',
            is_default: true,
            options: { redisUrl: REDIS_URL },
          },
        ],
      },
    },
    {
      resolve: '@medusajs/medusa/file',
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/file-local',
            id: 'local',
            options: {
              // The local provider bakes this into every uploaded file URL.
              // It must be the publicly reachable origin in production, or
              // images resolve to localhost and render broken.
              backend_url: process.env.FILE_BACKEND_URL || 'http://localhost:9000/static',
            },
          },
        ],
      },
    },
  ],
})
