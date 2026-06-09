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

import {
  vendorReservationQueryConfig,
} from "./query-config"
import {
  VendorCreateReservation,
  VendorGetReservationParams,
  VendorGetReservationsParams,
  VendorUpdateReservation,
} from "./validators"

// Mirror of `applySellerInventoryItemLinkFilter` in
// `vendor/inventory-items/middlewares.ts`. A reservation belongs to a
// seller iff its `inventory_item_id` belongs to the seller via the
// `inventory_item_seller` link. We push the seller_id onto
// `filterableFields` and then have `maybeApplyLinkFilter` join through
// the link table so the remote query only returns reservations on the
// seller's own inventory.
const applySellerReservationLinkFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.seller_context!.seller_id

  return maybeApplyLinkFilter({
    entryPoint: "inventory_item_seller",
    resourceId: "inventory_item_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const vendorReservationsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/reservations",
    middlewares: [
      validateAndTransformQuery(
        VendorGetReservationsParams,
        vendorReservationQueryConfig.list
      ),
      applySellerReservationLinkFilter,
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/reservations/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetReservationParams,
        vendorReservationQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/reservations",
    middlewares: [
      validateAndTransformBody(VendorCreateReservation),
      validateAndTransformQuery(
        VendorGetReservationParams,
        vendorReservationQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/reservations/:id",
    middlewares: [
      validateAndTransformBody(VendorUpdateReservation),
      validateAndTransformQuery(
        VendorGetReservationParams,
        vendorReservationQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/reservations/:id",
    middlewares: [],
  },
]
