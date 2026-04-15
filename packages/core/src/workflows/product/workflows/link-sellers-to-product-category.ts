import {
  createWorkflow,
  transform,
  WorkflowData,
} from "@medusajs/framework/workflows-sdk"

import { associateSellersWithProductCategoryStep } from "../steps/associate-sellers-with-product-category"
import { detachSellersFromProductCategoryStep } from "../steps/detach-sellers-from-product-category"

/**
 * Manages which sellers are restricted from a product category
 * (blacklist model — a link means the seller is BLOCKED from that category).
 */
export type LinkSellersToProductCategoryWorkflowInput = {
  /** The category id. */
  id: string
  /** Seller ids to block from the category. */
  add?: string[]
  /** Seller ids to unblock from the category. */
  remove?: string[]
}

export const linkSellersToProductCategoryWorkflowId =
  "link-sellers-to-product-category"

export const linkSellersToProductCategoryWorkflow = createWorkflow(
  linkSellersToProductCategoryWorkflowId,
  (
    input: WorkflowData<LinkSellersToProductCategoryWorkflowInput>
  ): WorkflowData<void> => {
    const toAdd = transform({ input }, ({ input }) =>
      (input.add ?? []).map((seller_id) => ({
        category_id: input.id,
        seller_id,
      }))
    )

    const toRemove = transform({ input }, ({ input }) =>
      (input.remove ?? []).map((seller_id) => ({
        category_id: input.id,
        seller_id,
      }))
    )

    associateSellersWithProductCategoryStep({ links: toAdd })
    detachSellersFromProductCategoryStep({ links: toRemove })
  }
)
