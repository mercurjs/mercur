import {
  requirePermission,
  restrictVendorFields,
  VENDOR_SELLER_PRIVATE_FIELD_SEGMENTS,
} from "../../utils"
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

// `line_items` are the cart line items that reference the offer: buyers' open
// carts, not the seller's orders.
const restrictVendorOfferFields = restrictVendorFields([
  ...VENDOR_SELLER_PRIVATE_FIELD_SEGMENTS,
  "line_items",
])

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
      restrictVendorOfferFields,
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
      restrictVendorOfferFields,
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
      restrictVendorOfferFields,
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
      restrictVendorOfferFields,
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
      restrictVendorOfferFields,
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
      restrictVendorOfferFields,
      validateAndTransformQuery(
        VendorGetOfferParams,
        vendorOfferQueryConfig.retrieve
      ),
    ],
  },
]
