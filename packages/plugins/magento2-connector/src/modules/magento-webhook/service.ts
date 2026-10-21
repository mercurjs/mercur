import { createHmac, timingSafeEqual } from "node:crypto"

import { MedusaService } from "@medusajs/framework/utils"

import { MagentoWebhookDelivery, MagentoWebhookEndpoint } from "./models"

const RETRY_DELAYS_MS = [
  60_000,
  5 * 60_000,
  30 * 60_000,
  2 * 60 * 60_000,
  12 * 60 * 60_000,
]

class MagentoWebhookModuleService extends MedusaService({
  MagentoWebhookEndpoint,
  MagentoWebhookDelivery,
}) {
  sign(body: string, secret: string): string {
    return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`
  }

  verify(body: string, secret: string, signature: string): boolean {
    const expected = Buffer.from(this.sign(body, secret))
    const received = Buffer.from(signature)

    return (
      expected.length === received.length && timingSafeEqual(expected, received)
    )
  }

  nextAttemptAt(attempts: number, now = new Date()): Date | null {
    const delay = RETRY_DELAYS_MS[attempts - 1]

    return delay === undefined ? null : new Date(now.getTime() + delay)
  }

  async listDueDeliveryIds(now = new Date()): Promise<string[]> {
    const deliveries = await this.listMagentoWebhookDeliveries(
      {
        status: ["pending", "failed"],
        next_attempt_at: { $lte: now },
      },
      { select: ["id"], take: 200 }
    )

    return deliveries.map((d) => d.id)
  }
}

export default MagentoWebhookModuleService
