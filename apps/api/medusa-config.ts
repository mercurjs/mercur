import { loadEnv } from '@medusajs/framework/utils'
import { withMercur } from '@mercurjs/core'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = withMercur({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
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
  modules: [
    {
      resolve: '@mercurjs/core/modules/admin-ui',
      options: {
        appDir: '',
        path: '/dashboard',
        disable: true
      }
    },
    {
      resolve: '@mercurjs/core/modules/vendor-ui',
      options: {
        appDir: '',
        path: '/seller',
        disable: true
      }
    },
  ],
})
