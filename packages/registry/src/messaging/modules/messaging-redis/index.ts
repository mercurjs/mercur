import { Module } from "@medusajs/framework/utils"

import MessagingRedisModuleService from "./service"
import messagingRedisConnectionLoader from "./loaders/connection"

export const MESSAGING_REDIS_MODULE = "messagingRedis"

export { MessagingRedisModuleService }

export default Module(MESSAGING_REDIS_MODULE, {
  service: MessagingRedisModuleService,
  loaders: [messagingRedisConnectionLoader],
})
