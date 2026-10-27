import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import {
  CreateShippingRuleDTO,
  MercurModules,
  ShippingRuleRequirement,
  UpdateShippingRuleDTO,
} from "@mercurjs/types"

import ShippingRuleModuleService from "../../../modules/shipping-rule/service"

type RuleTransit = {
  transit_min_days?: number | null
  transit_max_days?: number | null
}

const assertTransitRange = (rules: RuleTransit[]) => {
  for (const rule of rules) {
    if (
      rule.transit_min_days != null &&
      rule.transit_max_days != null &&
      rule.transit_min_days > rule.transit_max_days
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "transit_min_days cannot be greater than transit_max_days"
      )
    }
  }
}

export type UpsertShippingRulesStepInput = {
  create?: CreateShippingRuleDTO[]
  update?: UpdateShippingRuleDTO[]
}

export const upsertShippingRulesStepId = "upsert-shipping-rules"

export const upsertShippingRulesStep = createStep(
  upsertShippingRulesStepId,
  async (input: UpsertShippingRulesStepInput, { container }) => {
    assertTransitRange([...(input.create ?? []), ...(input.update ?? [])])

    const service = container.resolve<ShippingRuleModuleService>(
      MercurModules.SHIPPING_RULE
    )

    const updateIds = (input.update ?? []).map((rule) => rule.id)
    const before = updateIds.length
      ? await service.listShippingRules(
          { id: updateIds },
          { relations: ["prices"] }
        )
      : []

    const rules = await service.upsertShippingRulesWithPrices(input)

    const createdIds = rules
      .map((rule) => rule.id)
      .filter((id) => !updateIds.includes(id))

    const restore: UpdateShippingRuleDTO[] = before.map((prev) => ({
      id: prev.id,
      requirement: prev.requirement as ShippingRuleRequirement,
      price_type: prev.price_type,
      seller_can_edit_price: prev.seller_can_edit_price,
      transit_min_days: prev.transit_min_days,
      transit_max_days: prev.transit_max_days,
      seller_can_edit_transit: prev.seller_can_edit_transit,
      prices: prev.prices.map((price) => ({
        ...(price.currency_code ? { currency_code: price.currency_code } : {}),
        ...(price.region_id ? { region_id: price.region_id } : {}),
        amount: Number(price.amount),
      })),
    }))

    return new StepResponse(rules, { createdIds, restore })
  },
  async (compensation, { container }) => {
    if (!compensation) {
      return
    }
    const service = container.resolve<ShippingRuleModuleService>(
      MercurModules.SHIPPING_RULE
    )
    if (compensation.createdIds.length) {
      await service.deleteShippingRules(compensation.createdIds)
    }
    if (compensation.restore.length) {
      await service.upsertShippingRulesWithPrices({
        update: compensation.restore,
      })
    }
  }
)

export const deleteShippingRulesStepId = "delete-shipping-rules"

export const deleteShippingRulesStep = createStep(
  deleteShippingRulesStepId,
  async (ids: string[], { container }) => {
    if (!ids.length) {
      return new StepResponse(void 0, [])
    }
    const service = container.resolve<ShippingRuleModuleService>(
      MercurModules.SHIPPING_RULE
    )
    await service.softDeleteShippingRules(ids)
    return new StepResponse(void 0, ids)
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }
    const service = container.resolve<ShippingRuleModuleService>(
      MercurModules.SHIPPING_RULE
    )
    await service.restoreShippingRules(ids)
  }
)
