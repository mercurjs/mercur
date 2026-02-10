import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorRefundReasonResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [refund_reason],
  } = await query.graph({
    entity: "refund_reason",
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id,
    },
  })

  if (!refund_reason) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Refund reason with id ${req.params.id} was not found`
    )
  }

  res.json({ refund_reason })
}
