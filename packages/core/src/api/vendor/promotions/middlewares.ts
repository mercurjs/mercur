import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
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
  req.filterableFields.seller_id = req.seller_context!.seller_id

  return maybeApplyLinkFilter({
    entryPoint: "promotion_seller",
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
    policies: [
      {
        resource: PolicyResource.promotion,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.promotion,
        operation: PolicyOperation.create,
      },
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
    policies: [
      {
        resource: PolicyResource.promotion,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.promotion,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.promotion,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.promotion,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/promotions/:id",
    middlewares: [],
    policies: [
      {
        resource: PolicyResource.promotion,
        operation: PolicyOperation.delete,
      },
    ],
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
    policies: [
      {
        resource: PolicyResource.promotion,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.promotion,
        operation: PolicyOperation.update,
      },
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
    policies: [
      {
        resource: PolicyResource.promotion,
        operation: PolicyOperation.update,
      },
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
    policies: [
      {
        resource: PolicyResource.promotion,
        operation: PolicyOperation.update,
      },
    ],
  },
]
