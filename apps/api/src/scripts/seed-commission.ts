import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  CommissionRateTarget,
  CommissionRateType,
  MercurModules,
} from "@mercurjs/types"

import { createCommissionRatesWorkflow } from "@mercurjs/core-plugin/workflows"

export default async function seedCommissionData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const commissionService = container.resolve(
    MercurModules.COMMISSION
  )

  logger.info("Seeding commission rates...")

  const existingRates = await commissionService.listCommissionRates()
  const existingCodes = new Set(existingRates.map((r) => r.code))

  const ratesToCreate = [
    {
      name: "Default Item Commission",
      code: "DEFAULT_ITEM_PCT",
      type: CommissionRateType.PERCENTAGE,
      target: CommissionRateTarget.ITEM,
      value: 10,
      is_enabled: true,
      priority: 0,
    },
    {
      name: "Default Shipping Commission",
      code: "DEFAULT_SHIPPING_PCT",
      type: CommissionRateType.PERCENTAGE,
      target: CommissionRateTarget.SHIPPING,
      value: 5,
      is_enabled: true,
      priority: 0,
    },
  ].filter((rate) => !existingCodes.has(rate.code))

  if (ratesToCreate.length === 0) {
    logger.info("Commission rates already exist, skipping.")
  } else {
    await createCommissionRatesWorkflow(container).run({
      input: ratesToCreate,
    })
    logger.info(
      `Created ${ratesToCreate.length} commission rate(s): ${ratesToCreate.map((r) => r.code).join(", ")}`
    )
  }

  logger.info("Finished seeding commission data.")
}
