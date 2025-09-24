import { getOrderDetailWorkflow } from '@medusajs/core-flows'
import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http'
import { HttpTypes } from '@medusajs/framework/types'
import { AdminGetOrdersOrderParamsType } from '@medusajs/medusa/api/admin/claims/validators'

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetOrdersOrderParamsType>,
  res: MedusaResponse<HttpTypes.AdminOrderResponse>
) => {
  const workflow = getOrderDetailWorkflow(req.scope)
  const { result } = await workflow.run({
    input: {
      fields: req.queryConfig.fields,
      order_id: req.params.id,
      version: req.validatedQuery.version as number
    }
  })

  if (result.summary) {
    result.summary.pending_difference = '0'
  }

  res.status(200).json({ order: result as HttpTypes.AdminOrder })
}
