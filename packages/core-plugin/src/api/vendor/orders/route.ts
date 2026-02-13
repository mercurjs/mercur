import { getOrdersListWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { OrderDTO } from "@medusajs/framework/types"
import { HttpTypes } from "@mercurjs/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorOrderListResponse>
) => {
  const variables = {
    filters: {
      ...req.filterableFields,
      is_draft_order: false,
    },
    ...req.queryConfig.pagination,
  }

  const workflow = getOrdersListWorkflow(req.scope)
  const { result } = await workflow.run({
    input: {
      fields: req.queryConfig.fields,
      variables,
    },
  })

  const { rows, metadata } = result as {
    rows: OrderDTO[]
    metadata: any
  }

  res.json({
    orders: rows as unknown as HttpTypes.VendorOrderListResponse["orders"],
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}
