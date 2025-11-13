import {
  MiddlewareRoute,
  unlessPath,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";

import sellerPromotion from "../../../links/seller-promotion";
import {
  checkResourceOwnershipByResourceId,
  filterBySellerId,
} from "../../../shared/infra/http/middlewares";
import {
  listRuleValueTransformQueryConfig,
  vendorPromotionQueryConfig,
  vendorRuleTransformQueryConfig,
} from "./query-config";
import {
  VendorBatchPromotionRules,
  VendorCreatePromotion,
  VendorGetPromotionRuleParams,
  VendorGetPromotionRuleTypeParams,
  VendorGetPromotionsParams,
  VendorGetPromotionsRuleValueParams,
  VendorUpdatePromotion,
} from "./validators";
import { vendorPromotionsRuleValueOptionsPathParamsGuard } from "../../../shared/infra/http/middlewares/vendor-promotions-rule-value-options-path-params-guard";

export const vendorPromotionsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/promotions",
    middlewares: [
      validateAndTransformQuery(
        VendorGetPromotionsParams,
        vendorPromotionQueryConfig.list
      ),
      filterBySellerId(),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/promotions/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetPromotionsParams,
        vendorPromotionQueryConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerPromotion.entryPoint,
        filterField: "promotion_id",
      }),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/promotions/:id/:rule_type",
    middlewares: [
      unlessPath(
        /.*\/promotions\/rule-attribute-options/,
        validateAndTransformQuery(
          VendorGetPromotionRuleTypeParams,
          vendorPromotionQueryConfig.retrieve
        )
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerPromotion.entryPoint,
        filterField: "promotion_id",
      }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/promotions/:id",
    middlewares: [
      validateAndTransformBody(VendorUpdatePromotion),
      validateAndTransformQuery(
        VendorGetPromotionsParams,
        vendorPromotionQueryConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerPromotion.entryPoint,
        filterField: "promotion_id",
      }),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/promotions/:id",
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerPromotion.entryPoint,
        filterField: "promotion_id",
      }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/promotions",
    middlewares: [
      validateAndTransformBody(VendorCreatePromotion),
      validateAndTransformQuery(
        VendorGetPromotionsParams,
        vendorPromotionQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/promotions/:id/buy-rules/batch",
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerPromotion.entryPoint,
        filterField: "promotion_id",
      }),
      validateAndTransformBody(VendorBatchPromotionRules),
      validateAndTransformQuery(
        VendorGetPromotionsParams,
        vendorPromotionQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/promotions/:id/rules/batch",
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerPromotion.entryPoint,
        filterField: "promotion_id",
      }),
      validateAndTransformBody(VendorBatchPromotionRules),
      validateAndTransformQuery(
        VendorGetPromotionsParams,
        vendorPromotionQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/promotions/:id/target-rules/batch",
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerPromotion.entryPoint,
        filterField: "promotion_id",
      }),
      validateAndTransformBody(VendorBatchPromotionRules),
      validateAndTransformQuery(
        VendorGetPromotionsParams,
        vendorPromotionQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher:
      "/vendor/promotions/rule-value-options/:rule_type/:rule_attribute_id",
    middlewares: [
      vendorPromotionsRuleValueOptionsPathParamsGuard,
      validateAndTransformQuery(
        VendorGetPromotionsRuleValueParams,
        listRuleValueTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/promotions/rule-attribute-options/:rule_type",
    middlewares: [
      validateAndTransformQuery(
        VendorGetPromotionRuleParams,
        vendorRuleTransformQueryConfig.list
      ),
    ],
  },
];
