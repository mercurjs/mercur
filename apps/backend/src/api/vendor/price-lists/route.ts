import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { fetchPriceList } from '@medusajs/medusa/api/admin/price-lists/helpers'
import { createPriceListsWorkflow } from '@medusajs/medusa/core-flows'

import { VendorCreatePriceListType } from './validators'

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreatePriceListType>,
  res: MedusaResponse
) => {
  const workflow = createPriceListsWorkflow(req.scope)
  const { result } = await workflow.run({
    input: { price_lists_data: [req.validatedBody] }
  })

  const price_list = await fetchPriceList(
    result[0].id,
    req.scope,
    req.remoteQueryConfig.fields
  )

  res.status(200).json({ price_list })
}
