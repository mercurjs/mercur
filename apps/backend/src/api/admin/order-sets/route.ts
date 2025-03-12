import { getFormattedOrderSetListWorkflow } from '#/workflows/order-set/workflows'

import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const {
    result: { data, metadata }
  } = await getFormattedOrderSetListWorkflow(req.scope).run({
    input: {
      fields: req.queryConfig.fields,
      filters: req.filterableFields,
      pagination: req.queryConfig.pagination
    }
  })

  res.json({
    order_sets: data,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}
