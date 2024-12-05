import { getFormattedOrderSetListWorkflow } from '#/workflows/order-set/workflows'

import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const {
    result: { count, orderSets }
  } = await getFormattedOrderSetListWorkflow(req.scope).run({
    input: {
      fields: req.remoteQueryConfig.fields,
      variables: {
        filters: req.filterableFields,
        pagination: req.remoteQueryConfig.pagination
      }
    }
  })

  res.json({
    order_sets: orderSets,
    count,
    offset: req.remoteQueryConfig.pagination.skip,
    limit: req.remoteQueryConfig.pagination.take
  })
}
