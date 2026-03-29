import Redis from "ioredis"

type MessagingRedisModuleOptions = {
  redisUrl?: string
}

class MessagingRedisModuleService {
  private connection_: Redis | null

  static readonly identifier = "messagingRedis"

  __hooks: Record<string, () => Promise<void>>

  constructor(
    { messagingRedisConnection }: { messagingRedisConnection: Redis | null },
    options: MessagingRedisModuleOptions
  ) {
    this.connection_ = messagingRedisConnection

    this.__hooks = {
      onApplicationShutdown: async () => {
        if (this.connection_) {
          this.connection_.disconnect()
        }
      },
    }
  }

  get isAvailable(): boolean {
    return this.connection_ !== null
  }

  // --- Token operations (SSE one-time tokens) ---

  async setToken(token: string, value: string, ttlSeconds: number): Promise<void> {
    if (!this.connection_) return
    await this.connection_.set(`sse_token:${token}`, value, "EX", ttlSeconds)
  }

  async consumeToken(token: string): Promise<string | null> {
    if (!this.connection_) return null
    // Atomic get-and-delete to prevent TOCTOU race (token reuse)
    const value = await this.connection_.getdel(`sse_token:${token}`)
    return value
  }

  // --- Rate limiting ---

  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; count: number }> {
    if (!this.connection_) return { allowed: true, count: 0 }

    // Atomic INCR + conditional EXPIRE via Lua to prevent orphaned keys
    const luaScript = `
      local count = redis.call('INCR', KEYS[1])
      if count == 1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
      end
      return count
    `
    const count = await this.connection_.eval(
      luaScript, 1, key, windowSeconds
    ) as number

    return { allowed: count <= limit, count }
  }

  // --- Pub/Sub: publish ---

  async publish(channel: string, data: Record<string, unknown>): Promise<void> {
    if (!this.connection_) return
    await this.connection_.publish(channel, JSON.stringify(data))
  }

  // --- Pub/Sub: create subscriber ---

  createSubscriber(): Redis | null {
    if (!this.connection_) return null
    return this.connection_.duplicate()
  }

  // --- Notification throttle ---

  async trySetThrottle(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.connection_) return true // No Redis = allow (don't block notifications)

    const result = await this.connection_.set(key, "1", "EX", ttlSeconds, "NX")
    return result === "OK"
  }
}

export default MessagingRedisModuleService
