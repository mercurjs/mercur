import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerCustomer } from "../helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorCustomerResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.auth_context.actor_id

  await validateSellerCustomer(req.scope, sellerId, req.params.id)

  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!customer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Customer with id ${req.params.id} was not found`
    )
  }

  res.json({ customer })
}
