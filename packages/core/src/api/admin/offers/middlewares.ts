import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { applyGroupedOfferProductFilter } from "../../utils"
import { adminOfferQueryConfig } from "./query-config"
import {
  AdminCreateOffersBatch,
  AdminGetOfferParams,
  AdminGetOffersParams,
} from "./validators"

export const adminOffersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/offers",
    middlewares: [
      validateAndTransformQuery(
        AdminGetOffersParams,
        adminOfferQueryConfig.list
      ),
      applyGroupedOfferProductFilter,
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
    matcher: "/admin/offers/batch",
    middlewares: [
      validateAndTransformBody(AdminCreateOffersBatch),
      validateAndTransformQuery(
        AdminGetOffersParams,
        adminOfferQueryConfig.list
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
    matcher: "/admin/offers/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetOfferParams,
        adminOfferQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.offer,
        operation: PolicyOperation.read,
      },
    ],
  },
]
