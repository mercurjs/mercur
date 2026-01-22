import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminOrderGroupResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [order_group],
  } = await query.graph({
    entity: "order_group",
    filters: {
      id: req.params.id,
    },
    fields: req.queryConfig.fields,
  })

  if (!order_group) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Order group with id ${req.params.id} was not found`
    )
  }

  res.json({ order_group })
}
