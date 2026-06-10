import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"

const maybeApplySellerShippingOptionFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  if (!req.query.seller_id) {
    return next()
  }

  req.filterableFields.seller_id = req.query.seller_id

  return maybeApplyLinkFilter({
    entryPoint: "shipping_option_seller",
    resourceId: "shipping_option_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const adminShippingOptionsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/shipping-options",
    middlewares: [maybeApplySellerShippingOptionFilter],
  },
]
