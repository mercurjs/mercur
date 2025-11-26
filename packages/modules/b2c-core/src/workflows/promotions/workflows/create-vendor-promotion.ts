import { CreatePromotionDTO, CreatePromotionRuleDTO, LinkDefinition } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import {
  createPromotionsWorkflow,
  createRemoteLinkStep,
} from "@medusajs/medusa/core-flows";
import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/workflows-sdk";

import { SELLER_MODULE } from "../../../modules/seller";

import {
  verifyVendorTargetPromotionRulesStep,
  verifyVendorCampaignStep,
  verifyVendorPromotionStep,
} from "../steps";

export const createVendorPromotionWorkflow = createWorkflow(
  "create-vendor-promotion",
  function (input: { promotion: CreatePromotionDTO; seller_id: string }) {
    verifyVendorCampaignStep(input);
    verifyVendorPromotionStep(input);
    verifyVendorTargetPromotionRulesStep(
      transform(input, (input) => ({
        rules: input.promotion.application_method.target_rules,
        seller_id: input.seller_id,
      }))
    );

    const promotionWithVendorRule = transform(input, ({ promotion, seller_id }) => ({
      ...promotion,
      application_method: {
        ...promotion.application_method,
        target_rules: [
          ...(promotion.application_method?.target_rules || []),
          {
            attribute: "items.product.seller.id",
            operator: "eq",
            values: [seller_id],
          } as CreatePromotionRuleDTO,
        ],
      },
    }));

    const promotions = createPromotionsWorkflow.runAsStep({
      input: {
        promotionsData: [promotionWithVendorRule],
      },
    });

    const links = transform({ input, promotions }, ({ input, promotions }) => {
      const promo = promotions[0];
      const link: LinkDefinition[] = [
        {
          [SELLER_MODULE]: {
            seller_id: input.seller_id,
          },
          [Modules.PROMOTION]: {
            promotion_id: promo.id,
          },
        },
      ];

      if (promo.campaign) {
        link.push({
          [SELLER_MODULE]: {
            seller_id: input.seller_id,
          },
          [Modules.PROMOTION]: {
            campaign_id: promo.campaign.id,
          },
        });
      }
      return link;
    });

    createRemoteLinkStep(links);
    return new WorkflowResponse(promotions);
  }
);
