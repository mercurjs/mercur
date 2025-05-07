import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

import { getFormattedOrderSetListWorkflow } from '../../../../workflows/order-set/workflows'

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params

  const {
    result: { data }
  } = await getFormattedOrderSetListWorkflow(req.scope).run({
    input: { filters: { id } }
  })

  res.json({
    order_set: data[0]
  })
}
