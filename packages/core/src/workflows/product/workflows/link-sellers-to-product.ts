import {
  createWorkflow,
  transform,
  WorkflowData,
} from "@medusajs/framework/workflows-sdk"

import { associateSellersWithProductStep } from "../steps/associate-sellers-with-product"
import { detachSellersFromProductStep } from "../steps/detach-sellers-from-product"

/**
 * Manages which sellers are authorized to sell a product
 * (via the `product_seller_authorization` link table).
 */
export type LinkSellersToProductWorkflowInput = {
  /** The product id. */
  id: string
  /** Seller ids to authorize for the product. */
  add?: string[]
  /** Seller ids to revoke authorization from. */
  remove?: string[]
}

export const linkSellersToProductWorkflowId = "link-sellers-to-product"

export const linkSellersToProductWorkflow = createWorkflow(
  linkSellersToProductWorkflowId,
  (
    input: WorkflowData<LinkSellersToProductWorkflowInput>
  ): WorkflowData<void> => {
    const toAdd = transform({ input }, ({ input }) =>
      (input.add ?? []).map((seller_id) => ({
        product_id: input.id,
        seller_id,
      }))
    )

    const toRemove = transform({ input }, ({ input }) =>
      (input.remove ?? []).map((seller_id) => ({
        product_id: input.id,
        seller_id,
      }))
    )

    associateSellersWithProductStep({ links: toAdd })
    detachSellersFromProductStep({ links: toRemove })
  }
)
