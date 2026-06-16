import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { linkCustomersToCustomerGroupWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@mercurjs/types"

import { refetchCustomerGroup, validateSellerCustomerGroup } from "../../helpers"
import { VendorManageCustomerGroupCustomersType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorManageCustomerGroupCustomersType>,
  res: MedusaResponse<HttpTypes.VendorCustomerGroupResponse>
) => {
  const { id } = req.params

  await validateSellerCustomerGroup(
    req.scope,
    req.seller_context!.seller_id,
    id
  )

  await linkCustomersToCustomerGroupWorkflow(req.scope).run({
    input: {
      id,
      add: req.validatedBody.add ?? [],
      remove: req.validatedBody.remove ?? [],
    },
  })

  const customer_group = await refetchCustomerGroup(
    id,
    req.scope,
    req.queryConfig.fields
  )

  res.json({ customer_group })
}
