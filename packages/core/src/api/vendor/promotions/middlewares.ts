import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { vendorPromotionQueryConfig, vendorPromotionRuleQueryConfig, vendorRuleValueQueryConfig } from "./query-config"
import {
  VendorCreatePromotion,
  VendorCreatePromotionRule,
  VendorGetPromotionParams,
  VendorGetPromotionRuleParams,
  VendorGetPromotionRuleTypeParams,
  VendorGetPromotionsParams,
  VendorGetPromotionsRuleValueParams,
  VendorUpdatePromotion,
  VendorUpdatePromotionRule,
} from "./validators"
import { createBatchBody } from "@medusajs/medusa/api/utils/validators"

const applySellerPromotionLinkFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.auth_context.actor_id

  return maybeApplyLinkFilter({
    entryPoint: "seller_promotion",
    resourceId: "promotion_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const vendorPromotionsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/promotions",
    middlewares: [
      validateAndTransformQuery(
        VendorGetPromotionsParams,
        vendorPromotionQueryConfig.list
      ),
      applySellerPromotionLinkFilter,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/promotions",
    middlewares: [
      validateAndTransformBody(VendorCreatePromotion),
      validateAndTransformQuery(
        VendorGetPromotionParams,
        vendorPromotionQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/promotions/rule-attribute-options/:rule_type",
    middlewares: [
      validateAndTransformQuery(
        VendorGetPromotionRuleParams,
        vendorPromotionRuleQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/promotions/rule-value-options/:rule_type/:rule_attribute_id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetPromotionsRuleValueParams,
        vendorRuleValueQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/promotions/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetPromotionParams,
        vendorPromotionQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/promotions/:id",
    middlewares: [
      validateAndTransformBody(VendorUpdatePromotion),
      validateAndTransformQuery(
        VendorGetPromotionParams,
        vendorPromotionQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/promotions/:id",
    middlewares: [],
  },
  {
    method: ["GET"],
    matcher: "/vendor/promotions/:id/:rule_type",
    middlewares: [
      validateAndTransformQuery(
        VendorGetPromotionRuleTypeParams,
        vendorPromotionQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/promotions/:id/rules/batch",
    middlewares: [
      validateAndTransformBody(
        createBatchBody(VendorCreatePromotionRule, VendorUpdatePromotionRule)
      ),
      validateAndTransformQuery(
        VendorGetPromotionRuleParams,
        vendorPromotionRuleQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/promotions/:id/target-rules/batch",
    middlewares: [
      validateAndTransformBody(
        createBatchBody(VendorCreatePromotionRule, VendorUpdatePromotionRule)
      ),
      validateAndTransformQuery(
        VendorGetPromotionRuleParams,
        vendorPromotionRuleQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/promotions/:id/buy-rules/batch",
    middlewares: [
      validateAndTransformBody(
        createBatchBody(VendorCreatePromotionRule, VendorUpdatePromotionRule)
      ),
      validateAndTransformQuery(
        VendorGetPromotionRuleParams,
        vendorPromotionRuleQueryConfig.retrieve
      ),
    ],
  },
]
