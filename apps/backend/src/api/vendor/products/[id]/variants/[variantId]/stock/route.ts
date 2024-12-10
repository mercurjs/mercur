import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { updateInventoryLevelsWorkflow } from '@medusajs/medusa/core-flows'

import { VendorUpdateInventoryLevel } from '../../../../validators'

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateInventoryLevel>,
  res: MedusaResponse
) => {
  const { result: inventory_level } = await updateInventoryLevelsWorkflow.run({
    input: [req.validatedBody],
    container: req.scope
  })

  res.json({
    inventory_level: inventory_level
  })
}
