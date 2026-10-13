import {
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/medusa"
import { MercurFeatureFlags } from "@mercurjs/types"

import { requireFeatureFlag } from "../../utils"
import { storeReturnRequestQueryConfig } from "./query-config"
import {
  StoreCreateReturnRequest,
  StoreGetReturnRequestParams,
  StoreGetReturnRequestsParams,
} from "./validators"

const applyCustomerFilter = (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.customer_id = req.auth_context.actor_id
  next()
}

export const storeReturnRequestsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/return-requests*",
    middlewares: [
      requireFeatureFlag(MercurFeatureFlags.RETURN_REQUEST),
      authenticate("customer", ["session", "bearer"]),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/return-requests",
    middlewares: [
      validateAndTransformQuery(
        StoreGetReturnRequestsParams,
        storeReturnRequestQueryConfig.list
      ),
      applyCustomerFilter,
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/return-requests",
    middlewares: [
      validateAndTransformBody(StoreCreateReturnRequest),
      validateAndTransformQuery(
        StoreGetReturnRequestParams,
        storeReturnRequestQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/return-requests/:id",
    middlewares: [
      validateAndTransformQuery(
        StoreGetReturnRequestParams,
        storeReturnRequestQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/return-requests/:id/withdraw",
    middlewares: [
      validateAndTransformQuery(
        StoreGetReturnRequestParams,
        storeReturnRequestQueryConfig.retrieve
      ),
    ],
  },
]
