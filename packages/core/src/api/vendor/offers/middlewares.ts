import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
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
      validateAndTransformQuery(
        VendorGetOffersParams,
        vendorOfferQueryConfig.list
      ),
      applySellerOfferFilter,
    ],
    policies: [
      {
        resource: PolicyResource.offer,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/offers",
    middlewares: [
      validateAndTransformBody(VendorCreateOffer),
      validateAndTransformQuery(
        VendorGetOfferParams,
        vendorOfferQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.offer,
        operation: PolicyOperation.create,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/offers/batch",
    middlewares: [
      validateAndTransformBody(VendorCreateOffersBatch),
      validateAndTransformQuery(
        VendorGetOfferParams,
        vendorOfferQueryConfig.list
      ),
    ],
    policies: [
      {
        resource: PolicyResource.offer,
        operation: PolicyOperation.create,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/offers/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetOfferParams,
        vendorOfferQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.offer,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/offers/:id",
    middlewares: [
      validateAndTransformBody(VendorUpdateOffer),
      validateAndTransformQuery(
        VendorGetOfferParams,
        vendorOfferQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.offer,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/offers/:id",
    middlewares: [],
    policies: [
      {
        resource: PolicyResource.offer,
        operation: PolicyOperation.delete,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/offers/:id/inventory-items/batch",
    middlewares: [
      validateAndTransformBody(VendorBatchOfferInventoryItems),
      validateAndTransformQuery(
        VendorGetOfferParams,
        vendorOfferQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.offer,
        operation: PolicyOperation.update,
      },
    ],
  },
]
