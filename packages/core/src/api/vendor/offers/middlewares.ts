import { requirePermission } from "../../utils"
import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { vendorOfferQueryConfig } from "./query-config"
import {
  VendorBatchOfferInventoryItems,
  VendorCreateOffer,
  VendorCreateOffersBatch,
  VendorGetOfferParams,
  VendorGetOffersParams,
  VendorUpdateOffer,
} from "./validators"

const applySellerOfferFilter = (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.seller_context!.seller_id
  next()
}

export const vendorOffersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/offers",
    middlewares: [
      requirePermission("offers", "view"),
      validateAndTransformQuery(
        VendorGetOffersParams,
        vendorOfferQueryConfig.list
      ),
      applySellerOfferFilter,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/offers",
    middlewares: [
      requirePermission("offers", "edit"),
      validateAndTransformBody(VendorCreateOffer),
      validateAndTransformQuery(
        VendorGetOfferParams,
        vendorOfferQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/offers/batch",
    middlewares: [
      requirePermission("offers", "edit"),
      validateAndTransformBody(VendorCreateOffersBatch),
      validateAndTransformQuery(
        VendorGetOfferParams,
        vendorOfferQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/offers/:id",
    middlewares: [
      requirePermission("offers", "view"),
      validateAndTransformQuery(
        VendorGetOfferParams,
        vendorOfferQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/offers/:id",
    middlewares: [
      requirePermission("offers", "edit"),
      validateAndTransformBody(VendorUpdateOffer),
      validateAndTransformQuery(
        VendorGetOfferParams,
        vendorOfferQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/offers/:id",
    middlewares: [
      requirePermission("offers", "manage"),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/offers/:id/inventory-items/batch",
    middlewares: [
      requirePermission("offers", "edit"),
      validateAndTransformBody(VendorBatchOfferInventoryItems),
      validateAndTransformQuery(
        VendorGetOfferParams,
        vendorOfferQueryConfig.retrieve
      ),
    ],
  },
]
