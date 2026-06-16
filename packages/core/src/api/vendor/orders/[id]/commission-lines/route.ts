import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { getOrderCommissionLines } from "../../../../utils/order-commission-lines"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const sellerId = req.seller_context!.seller_id

  const { found, commission_lines } = await getOrderCommissionLines(
    req.scope,
    req.params.id,
    sellerId
  )

  if (!found) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Order with id ${req.params.id} was not found`
    )
  }

  res.json({
    commission_lines,
    count: commission_lines.length,
  })
}
