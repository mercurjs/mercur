import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { adminCommissionRateQueryConfig } from "./query-config"
import {
  AdminGetCommissionRateParams,
  AdminGetCommissionRatesParams,
  AdminCreateCommissionRate,
  AdminUpdateCommissionRate,
  AdminBatchCommissionRules,
} from "./validators"

export const adminCommissionRatesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/commission-rates",
    middlewares: [
      validateAndTransformQuery(
        AdminGetCommissionRatesParams,
        adminCommissionRateQueryConfig.list
      ),
    ],
    policies: [
      {
        resource: PolicyResource.commission_rate,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/commission-rates",
    middlewares: [
      validateAndTransformBody(AdminCreateCommissionRate),
      validateAndTransformQuery(
        AdminGetCommissionRateParams,
        adminCommissionRateQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.commission_rate,
        operation: PolicyOperation.create,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/commission-rates/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetCommissionRateParams,
        adminCommissionRateQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.commission_rate,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/commission-rates/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateCommissionRate),
      validateAndTransformQuery(
        AdminGetCommissionRateParams,
        adminCommissionRateQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.commission_rate,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/commission-rates/:id",
    middlewares: [],
    policies: [
      {
        resource: PolicyResource.commission_rate,
        operation: PolicyOperation.delete,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/commission-rates/:id/rules",
    middlewares: [
      validateAndTransformBody(AdminBatchCommissionRules),
    ],
    policies: [
      {
        resource: PolicyResource.commission_rate,
        operation: PolicyOperation.update,
      },
    ],
  },
]
