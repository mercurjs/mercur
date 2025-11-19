import { ContainerRegistrationKeys, defineConfig, loadEnv } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      // @ts-expect-error: vendorCors is not a valid config
      vendorCors: process.env.VENDOR_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret'
    }
  },
  plugins: [
    {
      resolve: '@mercurjs/b2c-core',
      options: {}
    },
    {
      resolve: '@mercurjs/commission',
      options: {}
    },
    {
      resolve: '@mercurjs/algolia',
      options: {
        apiKey: process.env.ALGOLIA_API_KEY,
        appId: process.env.ALGOLIA_APP_ID
      }
    },
    {
      resolve: '@mercurjs/reviews',
      options: {}
    },
    {
      resolve: '@mercurjs/requests',
      options: {}
    },
    {
      resolve: '@mercurjs/resend',
      options: {}
    }
  ],
  modules: [
    {
      resolve: '@medusajs/medusa/payment',
      options: {
        providers: [
          {
            resolve:
              '@mercurjs/payment-stripe-connect/providers/stripe-connect',
            id: 'stripe-connect',
            options: {
              apiKey: process.env.STRIPE_SECRET_API_KEY
            }
          }
        ]
      }
    },
    {
      resolve: '@medusajs/medusa/notification',
      options: {
        providers: [
          {
            resolve: '@mercurjs/resend/providers/resend',
            id: 'resend',
            options: {
              channels: ['email'],
              api_key: process.env.RESEND_API_KEY,
              from: process.env.RESEND_FROM_EMAIL
            }
          },
          {
            resolve: '@medusajs/medusa/notification-local',
            id: 'local',
            options: {
              channels: ['feed', 'seller_feed']
            }
          }
        ]
      }
    },
    {
      resolve: '@medusajs/medusa/auth',
      dependencies: [ContainerRegistrationKeys.LOGGER],
      options: {
        providers: [
          {
            resolve: '@mercurjs/b2c-core/providers/auth-email',
            id: 'emailpassword',
            options: {
              password: {
                minLength: parseInt(process.env.AUTH_PASSWORD_MIN_LENGTH || '8', 10),
                requireUppercase: process.env.AUTH_PASSWORD_REQUIRE_UPPERCASE === 'true',
                requireLowercase: process.env.AUTH_PASSWORD_REQUIRE_LOWERCASE === 'true',
                requireNumbers: process.env.AUTH_PASSWORD_REQUIRE_NUMBERS === 'true',
                requireSpecialChars: process.env.AUTH_PASSWORD_REQUIRE_SPECIAL_CHARS === 'true'
              },
              email: {
                lowercase: process.env.AUTH_EMAIL_LOWERCASE !== 'false',
                stripPlusSuffix: process.env.AUTH_EMAIL_STRIP_PLUS_SUFFIX === 'true'
              },
              name: {
                minLength: parseInt(process.env.AUTH_NAME_MIN_LENGTH || '1', 10),
                maxLength: process.env.AUTH_NAME_MAX_LENGTH ? parseInt(process.env.AUTH_NAME_MAX_LENGTH, 10) : undefined
              },
              surname: {
                minLength: parseInt(process.env.AUTH_SURNAME_MIN_LENGTH || '1', 10),
                maxLength: process.env.AUTH_SURNAME_MAX_LENGTH ? parseInt(process.env.AUTH_SURNAME_MAX_LENGTH, 10) : undefined
              }
            }
          }
        ]
      }
    }
  ]
})
