import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"

export function filterBySellerId() {
  return (
    req: MedusaRequest,
    _res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    req.filterableFields.seller_id = req.seller_context!.seller_id
    next()
  }
}
