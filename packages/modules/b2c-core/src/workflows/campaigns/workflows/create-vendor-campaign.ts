import { CreateCampaignDTO } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import {
  createCampaignsWorkflow,
  createRemoteLinkStep,
} from "@medusajs/medusa/core-flows";
import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/workflows-sdk";

import { SELLER_MODULE } from "../../../modules/seller";

export const createVendorCampaignWorkflow = createWorkflow(
  "create-vendor-campaign",
  function (input: { campaign: CreateCampaignDTO; seller_id: string }) {
    const campaigns = createCampaignsWorkflow.runAsStep({
      input: {
        campaignsData: [input.campaign],
      },
    });

    const links = transform({ input, campaigns }, ({ input, campaigns }) =>
      campaigns.map((p) => {
        return {
          [SELLER_MODULE]: {
            seller_id: input.seller_id,
          },
          [Modules.PROMOTION]: {
            campaign_id: p.id,
          },
        };
      })
    );

    createRemoteLinkStep(links);
    return new WorkflowResponse(campaigns);
  }
);
