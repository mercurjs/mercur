import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

import { getFormattedOrderSetListWorkflow } from '../../../../workflows/order-set/workflows'

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const {
    result: {
      data: [order_set]
    }
  } = await getFormattedOrderSetListWorkflow(req.scope).run({
    input: {
      fields: req.queryConfig.fields,
      filters: { id: req.params.id },
      pagination: req.queryConfig.pagination
    }
  })

  res.json({ order_set })
}
