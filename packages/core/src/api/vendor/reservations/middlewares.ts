import {
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

export const vendorReservationsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/reservations",
    middlewares: [
      validateAndTransformQuery(
        VendorGetReservationsParams,
        vendorReservationQueryConfig.list
      ),
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
