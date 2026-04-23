import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { adminOrderGroupsMiddlewares } from "./order-groups/middlewares"
import { adminOrderGroupQueryConfig } from "./order-groups/query-config"
import { AdminGetOrderGroupParams } from "./order-groups/validators"
import { adminPayoutsMiddlewares } from "./payouts/middlewares"
import { adminSellersMiddlewares } from "./sellers/middlewares"
import { adminMembersMiddlewares } from "./members/middlewares"
import { adminAttributeMiddlewares } from "./attributes/middlewares"
import { adminCommissionRatesMiddlewares } from "./commission-rates/middlewares"
import { adminSubscriptionPlanRoutesMiddlewares } from "./subscription-plans/middlewares"
import { requireAdminWarehouseCapability } from "./middlewares/require-warehouse-capability"
import { validateCancelOrderMiddleware } from "./middlewares/validate-cancel-order"

const maybeApplySellerProductFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  if (!req.query.seller_id) {
    return next()
  }

  req.filterableFields.seller_id = req.query.seller_id

  return maybeApplyLinkFilter({
    entryPoint: "product_seller",
    resourceId: "product_id",
    filterableField: "seller_id",
  })(req, res, next)
}

const maybeApplySellerOrderFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  if (!req.query.seller_id) {
    return next()
  }

  req.filterableFields.seller_id = req.query.seller_id

  return maybeApplyLinkFilter({
    entryPoint: "order_seller",
    resourceId: "order_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const adminMiddlewares: MiddlewareRoute[] = [
  ...adminAttributeMiddlewares,
  ...adminOrderGroupsMiddlewares,
  {
    method: ["GET"],
    matcher: "/admin/orders/:id/order-group",
    middlewares: [
      validateAndTransformQuery(
        AdminGetOrderGroupParams,
        adminOrderGroupQueryConfig.retrieve
      ),
    ],
  },
  ...adminPayoutsMiddlewares,
  ...adminSellersMiddlewares,
  ...adminMembersMiddlewares,
  ...adminCommissionRatesMiddlewares,
  ...adminSubscriptionPlanRoutesMiddlewares,
  {
    method: ["GET"],
    matcher: "/admin/products",
    middlewares: [
      maybeApplySellerProductFilter,
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/orders",
    middlewares: [
      maybeApplySellerOrderFilter,
    ],
  },
  // Mercur cancel-order invariant — enforce marketplace rule regardless of flag.
  // See specs/005-admin-warehouse-capability-lock.
  {
    method: ["POST"],
    matcher: "/admin/orders/:id/cancel",
    middlewares: [validateCancelOrderMiddleware],
  },
  // Warehouse capability lock — gated by `admin_warehouse_management` feature flag.
  // Baseline Mercur keeps fulfillment vendor-owned; these matchers reject direct
  // admin calls unless the flag is explicitly enabled.
  {
    method: ["POST"],
    matcher: "/admin/orders/:id/fulfillments",
    middlewares: [requireAdminWarehouseCapability],
  },
  {
    method: ["POST"],
    matcher: "/admin/orders/:id/fulfillments/:fulfillment_id/cancel",
    middlewares: [requireAdminWarehouseCapability],
  },
  {
    method: ["POST"],
    matcher: "/admin/orders/:id/fulfillments/:fulfillment_id/mark-as-delivered",
    middlewares: [requireAdminWarehouseCapability],
  },
  {
    method: ["POST"],
    matcher: "/admin/orders/:id/fulfillments/:fulfillment_id/shipments",
    middlewares: [requireAdminWarehouseCapability],
  },
  {
    method: ["POST"],
    matcher: "/admin/returns/:id/receive",
    middlewares: [requireAdminWarehouseCapability],
  },
  {
    method: ["POST"],
    matcher: "/admin/returns/:id/receive/confirm",
    middlewares: [requireAdminWarehouseCapability],
  },
  {
    method: ["POST"],
    matcher: "/admin/returns/:id/receive-items",
    middlewares: [requireAdminWarehouseCapability],
  },
  {
    method: ["POST", "DELETE"],
    matcher: "/admin/returns/:id/receive-items/:action_id",
    middlewares: [requireAdminWarehouseCapability],
  },
  {
    method: ["POST"],
    matcher: "/admin/returns/:id/dismiss-items",
    middlewares: [requireAdminWarehouseCapability],
  },
  {
    method: ["POST", "DELETE"],
    matcher: "/admin/returns/:id/dismiss-items/:action_id",
    middlewares: [requireAdminWarehouseCapability],
  },
  {
    method: ["POST"],
    matcher: "/admin/reservations",
    middlewares: [requireAdminWarehouseCapability],
  },
  {
    method: ["POST", "DELETE"],
    matcher: "/admin/reservations/:id",
    middlewares: [requireAdminWarehouseCapability],
  },
]
