import { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const DEFAULT_ADMIN_PRODUCT_ROUTE_NOT_FOUND = { message: "Not found" }

export const blockDefaultAdminProductRoute = (
  _req: MedusaRequest,
  res: MedusaResponse,
  _next: MedusaNextFunction
) => {
  return res.status(404).json(DEFAULT_ADMIN_PRODUCT_ROUTE_NOT_FOUND)
}
