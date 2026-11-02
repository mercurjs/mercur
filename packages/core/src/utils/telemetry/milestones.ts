import { ConfigModule, Logger, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import type TelemetryModuleService from "../../modules/telemetry/service"
import { telemetryDisabledReason } from "./config"
import { createTelemetrySender } from "./sender"
import { collectBaseProperties } from "./snapshot"

export const TelemetryMilestones = {
  FIRST_PRODUCTION_BOOT: "first_production_boot",
  FIRST_SELLER: "first_seller",
  FIRST_SELLER_APPROVED: "first_seller_approved",
  FIRST_MEMBER_INVITED: "first_member_invited",
  FIRST_OFFER: "first_offer",
  FIRST_PRODUCT_PUBLISHED: "first_product_published",
  FIRST_ORDER: "first_order",
  FIRST_PAYOUT_ACCOUNT: "first_payout_account",
  FIRST_PAYOUT_PAID: "first_payout_paid",
  FIRST_COMMISSION_RULE: "first_commission_rule",
} as const

export type TelemetryMilestone = (typeof TelemetryMilestones)[keyof typeof TelemetryMilestones]

export const isTelemetryConfigEnabled = (container: MedusaContainer) => {
  const configModule = container.resolve<ConfigModule>(ContainerRegistrationKeys.CONFIG_MODULE)
  const mercur = (configModule.projectConfig as { mercur?: { telemetry?: boolean } }).mercur
  return mercur?.telemetry !== false
}

/**
 * Milestones are recorded from subscribers, which in a split deployment run in
 * the worker, so the worker-process rule that gates boot events does not apply.
 */
export async function recordMilestone(container: MedusaContainer, milestone: TelemetryMilestone): Promise<boolean> {
  try {
    const reason = telemetryDisabledReason({ configEnabled: isTelemetryConfigEnabled(container) })
    if (reason && reason !== "worker") {
      return false
    }

    const service = container.resolve<TelemetryModuleService>(MercurModules.TELEMETRY)
    const installation = await service.getOrCreateInstallation()
    const isNew = await service.recordMilestone(milestone)
    if (!isNew) {
      return false
    }

    const logger = container.resolve<Logger>(ContainerRegistrationKeys.LOGGER)
    const sender = createTelemetrySender({ logger })
    const base = collectBaseProperties(container, installation)

    await sender.capture([
      {
        event: "installation_milestone",
        distinct_id: installation.installation_id,
        properties: { ...base, milestone, days_since_install: base.instance_age_days },
      },
    ])
    return true
  } catch {
    return false
  }
}
