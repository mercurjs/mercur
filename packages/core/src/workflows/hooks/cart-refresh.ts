import { refreshCartItemsWorkflow } from "@medusajs/medusa/core-flows"

import { upsertCommissionLinesWorkflow } from "../commission"

refreshCartItemsWorkflow.hooks.beforeRefreshingPaymentCollection(
  async ({ input }, { container }) => {
    await upsertCommissionLinesWorkflow(container).run({
      input: {
        cart_id: input.cart_id,
      },
    })
  }
)
