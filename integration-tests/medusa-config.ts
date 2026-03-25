import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  featureFlags: {
    rbac: true,
  },
  modules: [
    {
      resolve: '@mercurjs/core-plugin/modules/admin-ui',
      options: {
        appDir: '',
        path: '/dashboard',
        disable: true
      }
    },
    {
      resolve: '@mercurjs/core-plugin/modules/vendor-ui',
      options: {
        appDir: '',
        path: '/seller',
        disable: true
      }
    },
    // Meilisearch block — loaded only when env vars are present (e.g. meilisearch integration tests)
    ...(process.env.MEILISEARCH_HOST ? [{
      resolve: '../packages/registry/src/meilisearch/modules/meilisearch',
      options: {
        host: process.env.MEILISEARCH_HOST,
        apiKey: process.env.MEILISEARCH_API_KEY,
      },
    }] : []),
  ],
  plugins: [
    {
      resolve: "@mercurjs/core-plugin",
      options: {}
    }
  ]
})
