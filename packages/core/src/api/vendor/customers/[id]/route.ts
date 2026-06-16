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
  const sellerId = req.seller_context!.seller_id

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

  // A customer may belong to groups owned by several sellers; only expose the
  // groups owned by the requesting seller (via the seller_customer_group link).
  if (customer.groups?.length) {
    const { data: ownedLinks } = await query.graph({
      entity: "seller_customer_group",
      fields: ["customer_group_id"],
      filters: {
        seller_id: sellerId,
        customer_group_id: customer.groups.map((g) => g.id),
      },
    })

    const ownedGroupIds = new Set(
      ownedLinks.map((link) => link.customer_group_id)
    )
    customer.groups = customer.groups.filter((g) => ownedGroupIds.has(g.id))
  }

  res.json({ customer })
}
