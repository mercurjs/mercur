import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { linkCustomerGroupsToCustomerWorkflow } from "@medusajs/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerCustomerGroup } from "../../../customer-groups/helpers"
import { validateSellerCustomer } from "../../helpers"
import { VendorManageCustomerCustomerGroupsType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorManageCustomerCustomerGroupsType>,
  res: MedusaResponse<HttpTypes.VendorCustomerResponse>
) => {
  const { id } = req.params
  const sellerId = req.seller_context!.seller_id

  await validateSellerCustomer(req.scope, sellerId, id)

  const add = req.validatedBody.add ?? []
  const remove = req.validatedBody.remove ?? []

  await validateSellerCustomerGroup(req.scope, sellerId, [...add, ...remove])

  await linkCustomerGroupsToCustomerWorkflow(req.scope).run({
    input: { id, add, remove },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: req.queryConfig.fields,
    filters: { id },
  })

  res.json({ customer })
}
