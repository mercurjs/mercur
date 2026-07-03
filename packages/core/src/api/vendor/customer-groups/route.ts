import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { createSellerCustomerGroupsWorkflow } from "../../../workflows/customer-group"
import { refetchCustomerGroup } from "./helpers"
import {
  VendorCreateCustomerGroupType,
  VendorGetCustomerGroupsParamsType,
} from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetCustomerGroupsParamsType>,
  res: MedusaResponse<HttpTypes.VendorCustomerGroupListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: customer_groups, metadata } = await query.graph({
    entity: "customer_group",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    customer_groups,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateCustomerGroupType>,
  res: MedusaResponse<HttpTypes.VendorCustomerGroupResponse>
) => {
  const sellerId = req.seller_context!.seller_id

  const { result } = await createSellerCustomerGroupsWorkflow(req.scope).run({
    input: {
      seller_id: sellerId,
      customer_groups: [req.validatedBody],
    },
  })

  const customer_group = await refetchCustomerGroup(
    result[0].id,
    req.scope,
    req.queryConfig.fields
  )

  res.json({ customer_group })
}
