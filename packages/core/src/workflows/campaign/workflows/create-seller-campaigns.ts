import { createCampaignsWorkflow } from "@medusajs/core-flows"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CreateCampaignDTO } from "@medusajs/framework/types"

import { linkSellerCampaignStep } from "../steps"

type CreateSellerCampaignsWorkflowInput = {
  campaigns: CreateCampaignDTO[]
  seller_id: string
}

export const createSellerCampaignsWorkflow = createWorkflow(
  "create-seller-campaigns",
  function (input: CreateSellerCampaignsWorkflowInput) {
    const createdCampaigns = createCampaignsWorkflow.runAsStep({
      input: {
        campaignsData: input.campaigns,
      },
    })

    const campaignIds = transform(
      createdCampaigns,
      (campaigns) => campaigns.map((c) => c.id)
    )

    linkSellerCampaignStep({
      seller_id: input.seller_id,
      campaign_ids: campaignIds,
    })

    return new WorkflowResponse(createdCampaigns)
  }
)
