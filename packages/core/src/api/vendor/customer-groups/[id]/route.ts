import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  deleteCustomerGroupsWorkflow,
  updateCustomerGroupsWorkflow,
} from "@medusajs/core-flows"
import { MedusaError } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { refetchCustomerGroup, validateSellerCustomerGroup } from "../helpers"
import { VendorUpdateCustomerGroupType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorCustomerGroupResponse>
) => {
  const { id } = req.params

  await validateSellerCustomerGroup(
    req.scope,
    req.seller_context!.seller_id,
    id
  )

  const customer_group = await refetchCustomerGroup(
    id,
    req.scope,
    req.queryConfig.fields
  )

  if (!customer_group) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Customer group with id: ${id} was not found`
    )
  }

  res.json({ customer_group })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateCustomerGroupType>,
  res: MedusaResponse<HttpTypes.VendorCustomerGroupResponse>
) => {
  const { id } = req.params

  await validateSellerCustomerGroup(
    req.scope,
    req.seller_context!.seller_id,
    id
  )

  await updateCustomerGroupsWorkflow(req.scope).run({
    input: {
      selector: { id },
      update: req.validatedBody,
    },
  })

  const customer_group = await refetchCustomerGroup(
    id,
    req.scope,
    req.queryConfig.fields
  )

  res.json({ customer_group })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorCustomerGroupDeleteResponse>
) => {
  const { id } = req.params

  await validateSellerCustomerGroup(
    req.scope,
    req.seller_context!.seller_id,
    id
  )

  await deleteCustomerGroupsWorkflow(req.scope).run({
    input: { ids: [id] },
  })

  res.json({
    id,
    object: "customer_group",
    deleted: true,
  })
}
