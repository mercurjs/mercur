import { LoaderOptions } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { asValue } from "@medusajs/framework/awilix"
import Redis from "ioredis"

export default async function messagingRedisConnectionLoader({
  container,
  options,
}: LoaderOptions): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const redisUrl = options?.redisUrl as string | undefined

  if (!redisUrl) {
    logger.warn(
      "[messaging-redis] No redisUrl provided in module options — Redis features disabled"
    )
    container.register("messagingRedisConnection", asValue(null))
    return
  }

  try {
    const connection = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 5) return null
        return Math.min(times * 200, 2000)
      },
    })

    await connection.connect()

    container.register("messagingRedisConnection", asValue(connection))

    logger.info("[messaging-redis] Connected to Redis")
  } catch (err) {
    logger.error(
      `[messaging-redis] Failed to connect to Redis: ${(err as Error).message}`
    )
    container.register("messagingRedisConnection", asValue(null))
  }
}
