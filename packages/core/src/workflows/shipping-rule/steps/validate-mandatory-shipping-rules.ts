import { createStep } from "@medusajs/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { ShippingRuleRequirement } from "@mercurjs/types"

import {
  listMissingMandatoryShippingRules,
  MissingMandatoryShippingRule,
} from "../utils"

const describe = (missing: MissingMandatoryShippingRule[]) =>
  missing
    .map((rule) => `${rule.shipping_method.name} (${rule.shipping_zone.name})`)
    .join(", ")

export type ValidateSellerMandatoryShippingRulesStepInput = {
  sellers: { seller_id: string; shipping_profile_ids: string[] }[]
}

export const validateSellerMandatoryShippingRulesStepId =
  "validate-seller-mandatory-shipping-rules"

export const validateSellerMandatoryShippingRulesStep = createStep(
  validateSellerMandatoryShippingRulesStepId,
  async (
    { sellers }: ValidateSellerMandatoryShippingRulesStepInput,
    { container }
  ) => {
    for (const { seller_id, shipping_profile_ids } of sellers) {
      const missing = await listMissingMandatoryShippingRules(
        container,
        seller_id,
        Array.from(new Set(shipping_profile_ids))
      )
      if (missing.length) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Enable the required shipping methods before listing offers in this shipping profile: ${describe(missing)}`
        )
      }
    }
  }
)

export type ValidateMandatoryShippingOptionRemovalStepInput = {
  seller_id: string
  shipping_option_ids: string[]
}

export const validateMandatoryShippingOptionRemovalStepId =
  "validate-mandatory-shipping-option-removal"

/**
 * A seller cannot drop the last option it holds for a mandatory rule.
 */
export const validateMandatoryShippingOptionRemovalStep = createStep(
  validateMandatoryShippingOptionRemovalStepId,
  async (
    { seller_id, shipping_option_ids }: ValidateMandatoryShippingOptionRemovalStepInput,
    { container }
  ) => {
    if (!shipping_option_ids.length) {
      return
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: removed } = await query.graph({
      entity: "shipping_option_shipping_rule",
      fields: ["shipping_rule_id"],
      filters: { shipping_option_id: shipping_option_ids },
    })
    const removedRuleIds = Array.from(
      new Set(
        (removed as { shipping_rule_id: string }[]).map(
          (link) => link.shipping_rule_id
        )
      )
    )
    if (!removedRuleIds.length) {
      return
    }

    const { data: rules } = await query.graph({
      entity: "shipping_rule",
      fields: ["id", "shipping_zone.name", "shipping_method.name"],
      filters: {
        id: removedRuleIds,
        requirement: ShippingRuleRequirement.MANDATORY,
      },
    })
    const mandatory = (
      rules as {
        id: string
        shipping_zone?: { name: string } | null
        shipping_method?: { name: string } | null
      }[]
    ).map((rule) => ({ shipping_rule_id: rule.id, shipping_rule: rule }))
    if (!mandatory.length) {
      return
    }

    const { data: sellerOptions } = await query.graph({
      entity: "shipping_option_seller",
      fields: ["shipping_option_id"],
      filters: { seller_id },
    })
    const remaining = (sellerOptions as { shipping_option_id: string }[])
      .map((link) => link.shipping_option_id)
      .filter((id) => !shipping_option_ids.includes(id))

    const { data: remainingLinks } = remaining.length
      ? await query.graph({
          entity: "shipping_option_shipping_rule",
          fields: ["shipping_rule_id"],
          filters: {
            shipping_option_id: remaining,
            shipping_rule_id: mandatory.map((link) => link.shipping_rule_id),
          },
        })
      : { data: [] }
    const stillCovered = new Set(
      (remainingLinks as { shipping_rule_id: string }[]).map(
        (link) => link.shipping_rule_id
      )
    )

    const uncovered = mandatory.filter(
      (link) => !stillCovered.has(link.shipping_rule_id)
    )
    if (uncovered.length) {
      const names = uncovered
        .map(
          (link) =>
            `${link.shipping_rule?.shipping_method?.name} (${link.shipping_rule?.shipping_zone?.name})`
        )
        .join(", ")
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `The marketplace requires these shipping methods: ${names}`
      )
    }
  }
)
