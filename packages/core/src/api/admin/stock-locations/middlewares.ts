import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"

const maybeApplySellerStockLocationFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  if (!req.query.seller_id) {
    return next()
  }

  req.filterableFields.seller_id = req.query.seller_id

  return maybeApplyLinkFilter({
    entryPoint: "stock_location_seller",
    resourceId: "stock_location_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const adminStockLocationsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/stock-locations",
    middlewares: [maybeApplySellerStockLocationFilter],
  },
]
