import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { assignBrandToProductWorkflow } from '../../../../../workflows/brand/workflows'
import { VendorAssignBrandNameType } from '../../validators'

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorAssignBrandNameType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  await assignBrandToProductWorkflow.run({
    container: req.scope,
    input: {
      brand_name: req.validatedBody.brand_name,
      product_id: id
    }
  })

  const {
    data: [product]
  } = await query.graph({
    entity: 'product',
    fields: req.remoteQueryConfig.fields,
    filters: {
      id
    }
  })

  res.json({ product })
}
