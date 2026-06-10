import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"

const maybeApplySellerShippingProfileFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  if (!req.query.seller_id) {
    return next()
  }

  req.filterableFields.seller_id = req.query.seller_id

  return maybeApplyLinkFilter({
    entryPoint: "shipping_profile_seller",
    resourceId: "shipping_profile_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const adminShippingProfilesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/shipping-profiles",
    middlewares: [maybeApplySellerShippingProfileFilter],
  },
]
