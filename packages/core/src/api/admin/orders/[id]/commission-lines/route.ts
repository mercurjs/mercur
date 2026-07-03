import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { CommissionLineDTO } from "@mercurjs/types"

import { getOrderCommissionLines } from "../../../../utils/order-commission-lines"

export type AdminOrderCommissionLinesResponse = {
  commission_lines: CommissionLineDTO[]
  count: number
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminOrderCommissionLinesResponse>
) => {
  const { found, commission_lines } = await getOrderCommissionLines(
    req.scope,
    req.params.id
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
