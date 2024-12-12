import { MedusaRequest } from '@medusajs/framework'
import { MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [onboarding]
  } = await query.graph({
    entity: 'onboarding',
    fields: req.remoteQueryConfig.fields,
    filters: req.filterableFields
  })

  res.status(200).json({ onboarding })
}
