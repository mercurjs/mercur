import { fetchShippingOptionForOrderWorkflow } from "@medusajs/medusa/core-flows"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Core-flow only seeds pricing context with `currency_code`. Seller shipping
// options whose price rules require `region_id` resolve to a null
// `calculated_price`, which then crashes `prepareShippingMethod` at
// `option.calculated_price.calculated_amount`. Inject the order's region so
// region-scoped shipping prices are calculable for claim/exchange/return flows.
fetchShippingOptionForOrderWorkflow.hooks.setPricingContext(
  async ({ order_id }, { container }) => {
    if (!order_id) {
      return new StepResponse({})
    }

    const query: any = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "region_id"],
      filters: { id: order_id },
    })

    const order = orders[0] as { region_id?: string | null } | undefined

    if (!order?.region_id) {
      return new StepResponse({})
    }

    return new StepResponse({ region_id: order.region_id })
  }
)
