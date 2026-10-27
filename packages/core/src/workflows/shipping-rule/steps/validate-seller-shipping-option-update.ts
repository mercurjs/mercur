import { createStep } from "@medusajs/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

const MARKETPLACE_FIELDS = [
  "provider_id",
  "type",
  "type_id",
  "price_type",
  "shipping_profile_id",
  "service_zone_id",
] as const

const TRANSIT_KEYS = ["transit_min_days", "transit_max_days"]

export type ValidateSellerShippingOptionUpdateStepInput = {
  shipping_option_id: string
  update: {
    prices?: unknown[]
    metadata?: Record<string, unknown> | null
  } & Partial<Record<(typeof MARKETPLACE_FIELDS)[number], unknown>>
}

export const validateSellerShippingOptionUpdateStepId =
  "validate-seller-shipping-option-update"

/**
 * The provider, option type and shipping profile of a seller's shipping option
 * are set by the marketplace. Prices and transit times follow the operator rule
 * the option was enabled from.
 */
export const validateSellerShippingOptionUpdateStep = createStep(
  validateSellerShippingOptionUpdateStepId,
  async (
    { shipping_option_id, update }: ValidateSellerShippingOptionUpdateStepInput,
    { container }
  ) => {
    const governed = MARKETPLACE_FIELDS.filter(
      (field) => update[field] !== undefined
    )
    if (governed.length) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `The marketplace manages these shipping option fields: ${governed.join(", ")}`
      )
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [option],
    } = await query.graph({
      entity: "shipping_option",
      fields: [
        "id",
        "shipping_rule.seller_can_edit_price",
        "shipping_rule.seller_can_edit_transit",
      ],
      filters: { id: shipping_option_id },
    })
    const rule = (
      option as {
        shipping_rule?: {
          seller_can_edit_price: boolean
          seller_can_edit_transit: boolean
        } | null
      }
    )?.shipping_rule
    if (!rule) {
      return
    }

    if (update.prices && !rule.seller_can_edit_price) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "The marketplace sets the price for this shipping method"
      )
    }

    const changesTransit =
      !!update.metadata &&
      TRANSIT_KEYS.some((key) => key in (update.metadata ?? {}))
    if (changesTransit && !rule.seller_can_edit_transit) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "The marketplace sets the transit time for this shipping method"
      )
    }
  }
)
