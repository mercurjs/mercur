import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { MESSAGING_REDIS_MODULE } from "../modules/messaging-redis"
import type MessagingRedisModuleService from "../modules/messaging-redis/service"

type MessageCreatedData = {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: "customer" | "seller"
  recipient_id: string
}

const THROTTLE_TTL_SECONDS = 900 // 15 minutes

export default async function messageNotificationHandler({
  event,
  container,
}: SubscriberArgs<MessageCreatedData>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const { conversation_id, sender_id, sender_type, recipient_id } = event.data

  try {
    // Check throttle — one notification per conversation per recipient per 15 min
    const redisService = container.resolve<MessagingRedisModuleService>(MESSAGING_REDIS_MODULE)
    const throttleKey = `notify:${conversation_id}:${recipient_id}`

    const allowed = await redisService.trySetThrottle(throttleKey, THROTTLE_TTL_SECONDS)

    if (!allowed) {
      // Already notified recently, skip
      return
    }

    // Resolve sender name for the email
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    let senderName = "Someone"

    if (sender_type === "customer") {
      try {
        const { data: customers } = await query.graph({
          entity: "customer",
          fields: ["id", "first_name"],
          filters: { id: sender_id },
        })
        if (customers?.length > 0) {
          senderName = customers[0].first_name || "A customer"
        }
      } catch {
        // Use default name
      }
    } else {
      try {
        const { data: sellers } = await query.graph({
          entity: "seller",
          fields: ["id", "name"],
          filters: { id: sender_id },
        })
        if (sellers?.length > 0) {
          senderName = sellers[0].name || "A vendor"
        }
      } catch {
        // Use default name
      }
    }

    // Resolve recipient email
    let recipientEmail: string | null = null
    const recipientType = sender_type === "customer" ? "seller" : "customer"

    if (recipientType === "customer") {
      try {
        const { data: customers } = await query.graph({
          entity: "customer",
          fields: ["id", "email"],
          filters: { id: recipient_id },
        })
        if (customers?.length > 0) {
          recipientEmail = customers[0].email
        }
      } catch {
        // Cannot determine email
      }
    }
    // For sellers, email notification requires seller email which may be in auth_identity
    // This is operator-customizable — emit notification event for flexibility

    if (!recipientEmail) {
      logger.debug(
        `Messaging: skipping email notification for ${recipientType} ${recipient_id} — no email found`
      )
      return
    }

    // Send notification via Medusa notification module
    // Privacy: no message body included in email
    try {
      const notificationService: { createNotifications: (data: Record<string, unknown>) => Promise<void> } =
        container.resolve("notification")
      await notificationService.createNotifications({
        to: recipientEmail,
        channel: "email",
        template: "messaging-new-message",
        data: {
          sender_name: senderName,
          conversation_id,
        },
      })

      logger.debug(
        `Messaging: email notification sent to ${recipientEmail} for conversation ${conversation_id}`
      )
    } catch (err) {
      logger.warn(
        `Messaging: failed to send email notification: ${(err as Error).message}`
      )
    }
  } catch (err) {
    logger.error(
      `Messaging: notification handler error: ${(err as Error).message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "messaging.message.created",
}
