import {
  createWorkflow,
  transform,
  WorkflowData,
} from "@medusajs/framework/workflows-sdk"

import { associateSellersWithProductBrandStep } from "../steps/associate-sellers-with-product-brand"
import { detachSellersFromProductBrandStep } from "../steps/detach-sellers-from-product-brand"

/**
 * Manages which sellers are authorized to use a restricted product brand
 * (whitelist model — only meaningful when `brand.is_restricted = true`).
 */
export type LinkSellersToProductBrandWorkflowInput = {
  /** The brand id. */
  id: string
  /** Seller ids to authorize for the brand. */
  add?: string[]
  /** Seller ids to revoke authorization from. */
  remove?: string[]
}

export const linkSellersToProductBrandWorkflowId =
  "link-sellers-to-product-brand"

export const linkSellersToProductBrandWorkflow = createWorkflow(
  linkSellersToProductBrandWorkflowId,
  (
    input: WorkflowData<LinkSellersToProductBrandWorkflowInput>
  ): WorkflowData<void> => {
    const toAdd = transform({ input }, ({ input }) =>
      (input.add ?? []).map((seller_id) => ({
        brand_id: input.id,
        seller_id,
      }))
    )

    const toRemove = transform({ input }, ({ input }) =>
      (input.remove ?? []).map((seller_id) => ({
        brand_id: input.id,
        seller_id,
      }))
    )

    associateSellersWithProductBrandStep({ links: toAdd })
    detachSellersFromProductBrandStep({ links: toRemove })
  }
)
