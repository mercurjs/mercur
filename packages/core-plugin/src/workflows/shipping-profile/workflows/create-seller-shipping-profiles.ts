import { createShippingProfilesWorkflow } from "@medusajs/core-flows"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CreateShippingProfileDTO } from "@medusajs/framework/types"

import { linkSellerShippingProfileStep } from "../steps"
import { CreateShippingProfilesWorkflowOutput } from "@medusajs/types/dist/workflow/fulfillment"

type CreateSellerShippingProfilesWorkflowInput = {
  shipping_profiles: CreateShippingProfileDTO[]
  seller_id: string
}
export const createSellerShippingProfilesWorkflow: ReturnType<typeof createWorkflow<CreateSellerShippingProfilesWorkflowInput, CreateShippingProfilesWorkflowOutput, any>> = createWorkflow(
  "create-seller-shipping-profiles",
  function (input: CreateSellerShippingProfilesWorkflowInput) {
    const createdShippingProfiles = createShippingProfilesWorkflow.runAsStep({
      input: {
        data: input.shipping_profiles,
      },
    })

    const shippingProfileIds = transform(
      createdShippingProfiles,
      (shippingProfiles) => shippingProfiles.map((sp) => sp.id)
    )

    linkSellerShippingProfileStep({
      seller_id: input.seller_id,
      shipping_profile_ids: shippingProfileIds,
    })

    return new WorkflowResponse(createdShippingProfiles)
  }
)
