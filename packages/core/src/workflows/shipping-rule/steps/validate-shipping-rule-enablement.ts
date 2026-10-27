import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { ShippingRuleRequirement } from "@mercurjs/types"

export type EnablementRule = {
  id: string
  requirement: string
  price_type: "flat" | "calculated"
  seller_can_edit_price: boolean
  seller_can_edit_transit: boolean
  transit_min_days: number | null
  transit_max_days: number | null
  prices: {
    currency_code: string | null
    region_id: string | null
    amount: number | string
  }[]
  shipping_zone: { id: string; is_active: boolean; geo_zones: unknown[] }
  shipping_method: { id: string; is_active: boolean }
  shipping_options?: { id: string; service_zone_id: string }[] | null
}

export type EnablementLocation = {
  id: string
  name: string
  seller?: { id: string } | null
  fulfillment_sets?:
    | {
        id: string
        type: string
        service_zones?:
          | { id: string; shipping_zone?: { id: string } | null }[]
          | null
      }[]
    | null
}

export type SellerShippingPriceInput = {
  currency_code?: string
  region_id?: string
  amount: number
}

export type ValidateShippingRuleEnablementStepInput = {
  seller_id: string
  rule: EnablementRule
  location: EnablementLocation
  prices?: SellerShippingPriceInput[]
  transit_min_days?: number | null
  transit_max_days?: number | null
}

export const validateShippingRuleEnablementStepId =
  "validate-shipping-rule-enablement"

/**
 * Resolves what the enabled option will carry: the operator's default prices
 * and transit unless the rule lets the seller override them.
 */
export const validateShippingRuleEnablementStep = createStep(
  validateShippingRuleEnablementStepId,
  async (input: ValidateShippingRuleEnablementStepInput) => {
    const { rule, location } = input

    if (location.seller?.id !== input.seller_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Stock location with id: ${location.id} was not found`
      )
    }

    if (
      rule.requirement === ShippingRuleRequirement.NOT_SUPPORTED ||
      !rule.shipping_zone.is_active ||
      !rule.shipping_method.is_active
    ) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Shipping rule ${rule.id} is not available`
      )
    }

    if (!rule.shipping_zone.geo_zones.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Shipping zone ${rule.shipping_zone.id} has no countries`
      )
    }

    const zoneIdsAtLocation = new Set(
      (location.fulfillment_sets ?? [])
        .filter((set) => set.type === "shipping")
        .flatMap((set) => set.service_zones ?? [])
        .filter((zone) => zone.shipping_zone?.id === rule.shipping_zone.id)
        .map((zone) => zone.id)
    )
    const alreadyEnabled = (rule.shipping_options ?? []).some((option) =>
      zoneIdsAtLocation.has(option.service_zone_id)
    )
    if (alreadyEnabled) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        `Shipping rule ${rule.id} is already enabled for stock location ${location.id}`
      )
    }

    const sellerPrices = input.prices
    if (sellerPrices?.length && !rule.seller_can_edit_price) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "The marketplace sets the price for this shipping method"
      )
    }

    const sellerTransit =
      input.transit_min_days !== undefined ||
      input.transit_max_days !== undefined
    if (sellerTransit && !rule.seller_can_edit_transit) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "The marketplace sets the transit time for this shipping method"
      )
    }

    const prices =
      rule.price_type === "calculated"
        ? []
        : sellerPrices?.length
          ? sellerPrices
          : rule.prices.map((price) => ({
              ...(price.currency_code
                ? { currency_code: price.currency_code }
                : {}),
              ...(price.region_id ? { region_id: price.region_id } : {}),
              amount: Number(price.amount),
            }))

    if (rule.price_type === "flat" && !prices.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "A price is required to enable this shipping method"
      )
    }

    const transitMin = sellerTransit
      ? (input.transit_min_days ?? null)
      : rule.transit_min_days
    const transitMax = sellerTransit
      ? (input.transit_max_days ?? null)
      : rule.transit_max_days
    if (transitMin != null && transitMax != null && transitMin > transitMax) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "transit_min_days cannot be greater than transit_max_days"
      )
    }

    return new StepResponse({
      prices,
      metadata: sellerTransit
        ? { transit_min_days: transitMin, transit_max_days: transitMax }
        : null,
    })
  }
)
