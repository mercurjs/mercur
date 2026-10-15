import {
  createWorkflow,
  transform,
  WorkflowData,
} from "@medusajs/framework/workflows-sdk"

import {
  associateSellersWithRegionsStep,
  detachSellersFromRegionsStep,
  SellerRegionLink,
  validateSellerRegionLinksStep,
} from "../steps"

export type LinkSellerRegionsWorkflowInput = {
  add?: SellerRegionLink[]
  remove?: SellerRegionLink[]
}

export const linkSellerRegionsWorkflowId = "link-seller-regions"

export const linkSellerRegionsWorkflow = createWorkflow(
  linkSellerRegionsWorkflowId,
  (input: WorkflowData<LinkSellerRegionsWorkflowInput>): WorkflowData<void> => {
    const toAdd = transform({ input }, ({ input }) => input.add ?? [])
    const toRemove = transform({ input }, ({ input }) => input.remove ?? [])

    validateSellerRegionLinksStep({ links: toAdd })
    associateSellersWithRegionsStep({ links: toAdd })
    detachSellersFromRegionsStep({ links: toRemove })
  }
)
