import { loadEnv } from "@medusajs/framework/utils"
import { withMercur } from "@mercurjs/core"

loadEnv(process.env.NODE_ENV || "production", process.cwd())

const REDIS_URL = process.env.REDIS_URL!
const CACHE_REDIS_URL = process.env.CACHE_REDIS_URL || REDIS_URL
const CORS = process.env.BENCH_CORS || "http://localhost"
const POOL_MAX = Number(process.env.DB_POOL_MAX || 20)

module.exports = withMercur({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseDriverOptions: {
      pool: { min: 2, max: POOL_MAX },
    },
    redisUrl: REDIS_URL,
    workerMode: (process.env.WORKER_MODE as "shared" | "server" | "worker") || "shared",
    http: {
      storeCors: CORS,
      adminCors: CORS,
      vendorCors: CORS,
      authCors: CORS,
      jwtSecret: process.env.JWT_SECRET!,
      cookieSecret: process.env.COOKIE_SECRET!,
    },
  },
  featureFlags: {
    seller_registration: true,
  },
  modules: [
    {
      resolve: "@mercurjs/core/modules/admin-ui",
      options: { appDir: "", path: "/dashboard", disable: true },
    },
    {
      resolve: "@mercurjs/core/modules/vendor-ui",
      options: { appDir: "", path: "/seller", disable: true },
    },
    {
      resolve: "@medusajs/medusa/cache-redis",
      options: { redisUrl: CACHE_REDIS_URL },
    },
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: { redisUrl: REDIS_URL },
    },
    {
      resolve: "@medusajs/medusa/workflow-engine-redis",
      options: { redis: { url: REDIS_URL } },
    },
    {
      resolve: "@medusajs/medusa/locking",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/locking-redis",
            id: "locking-redis",
            is_default: true,
            options: { redisUrl: REDIS_URL },
          },
        ],
      },
    },
  ],
})
