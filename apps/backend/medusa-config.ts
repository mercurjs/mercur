import { defineConfig, loadEnv } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret'
    }
  },
  modules: [
    { resolve: './src/modules/seller' },
    { resolve: './src/modules/marketplace' },
    {
      resolve: './src/modules/payout',
      options: {
        api_key: process.env.STRIPE_SECRET_API_KEY
      }
    },
    {
      resolve: '@medusajs/medusa/payment',
      options: {
        providers: [
          {
            resolve: './src/modules/payment-stripe-connect',
            id: 'stripe-connect',
            options: {
              apiKey: process.env.STRIPE_SECRET_API_KEY
            }
          }
        ]
      }
    }
  ]
})
