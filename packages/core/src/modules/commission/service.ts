import { Context } from "@medusajs/framework/types"
import {
  InjectManager,
  MathBN,
  MedusaContext,
  MedusaService,
} from "@medusajs/framework/utils"
import { PromotionTypes } from "@medusajs/framework/types"

import {
  ComputeCommissionActionsContext,
  CommissionRateType,
  CommissionRateTarget,
  CommissionRateDTO,
} from "@mercurjs/types"

import { CommissionRate, CommissionRule } from "./models"

class CommissionModuleService extends MedusaService({
  CommissionRate,
  CommissionRule,
}) {
  @InjectManager()
  async computeActions(
    context: ComputeCommissionActionsContext,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<PromotionTypes.ComputeActions[]> {
    const computedActions: PromotionTypes.ComputeActions[] = []
    const { items = [], shipping_methods = [], currency_code } = context

    // Get all enabled commission rates with their rules, ordered by priority DESC
    const commissionRates = await this.listCommissionRates(
      { is_enabled: true },
      { relations: ["rules"], order: { priority: "DESC" } },
      sharedContext
    )

    // Separate rates by target
    const itemRates = commissionRates.filter(
      (rate) => rate.target === CommissionRateTarget.ITEM
    )
    const shippingRates = commissionRates.filter(
      (rate) => rate.target === CommissionRateTarget.SHIPPING
    )

    // Process each item
    for (const item of items) {
      const product = item.product
      let matchedRate: CommissionRateDTO | null = null

      // Find matching rate based on rules (priority order)
      for (const rate of itemRates) {
        // Check currency code match if specified
        if (rate.currency_code && rate.currency_code !== currency_code) {
          continue
        }

        // If no rules, this is a default rate
        if (!rate.rules || rate.rules.length === 0) {
          matchedRate = rate
          break
        }

        // Check if any rule matches
        const ruleMatches = rate.rules.some((rule) => {
          if (!product) return false

          switch (rule.reference) {
            case "product":
              return product.id === rule.reference_id
            case "product_type":
              return product.type_id === rule.reference_id
            case "product_collection":
              return product.collection_id === rule.reference_id
            case "product_category":
              return product.categories?.some((cat) => cat.id === rule.reference_id) ?? false
            case "seller":
              return product.seller?.id === rule.reference_id
            default:
              return false
          }
        })

        if (ruleMatches) {
          matchedRate = rate
          break
        }
      }

      if (!matchedRate) {
        continue
      }

      // Calculate commission amount using MathBN
      let amount
      if (matchedRate.type === CommissionRateType.PERCENTAGE) {
        amount = MathBN.div(MathBN.mult(item.subtotal, matchedRate.value), 100)
      } else {
        amount = matchedRate.value
      }

      // Apply minimum commission if set
      if (matchedRate.min_amount !== null && MathBN.lt(amount, matchedRate.min_amount)) {
        amount = matchedRate.min_amount
      }

      computedActions.push({
        action: "addItemAdjustment",
        item_id: item.id,
        amount,
        code: matchedRate.code,
        is_tax_inclusive: matchedRate.is_tax_inclusive,
        description: `Commission: ${matchedRate.name}`,
      })
    }

    // Process shipping methods
    for (const shippingMethod of shipping_methods) {
      let matchedRate: CommissionRateDTO | null = null

      for (const rate of shippingRates) {
        // Check currency code match if specified
        if (rate.currency_code && rate.currency_code !== currency_code) {
          continue
        }

        // If no rules, this is a default rate
        if (!rate.rules || rate.rules.length === 0) {
          matchedRate = rate
          break
        }

        // Check if any rule matches shipping option
        const ruleMatches = rate.rules.some((rule) => {
          if (!shippingMethod.shipping_option) return false

          switch (rule.reference) {
            case "shipping_option_type":
              return shippingMethod.shipping_option.shipping_option_type_id === rule.reference_id
            default:
              return false
          }
        })

        if (ruleMatches) {
          matchedRate = rate
          break
        }
      }

      if (!matchedRate) {
        continue
      }

      // Calculate commission amount using MathBN
      let amount
      if (matchedRate.type === CommissionRateType.PERCENTAGE) {
        amount = MathBN.div(MathBN.mult(shippingMethod.subtotal, matchedRate.value), 100)
      } else {
        amount = matchedRate.value
      }

      // Apply minimum commission if set
      if (matchedRate.min_amount !== null && MathBN.lt(amount, matchedRate.min_amount)) {
        amount = matchedRate.min_amount
      }

      computedActions.push({
        action: "addShippingMethodAdjustment",
        shipping_method_id: shippingMethod.id,
        amount,
        code: matchedRate.code,
        description: `Shipping Commission: ${matchedRate.name}`,
      })
    }

    return computedActions
  }
}

export default CommissionModuleService
