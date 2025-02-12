import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'

import { AdminCreateDefaultShippingOptionType } from './validators'

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  // const carriers = await getAdminCarriersList(req.scope).run()
  const query = req.scope.resolve('query')

  const { data } = await query.graph({
    entity: 'default_shipping_option',
    fields: ['*']
  })
  res.json(data)
}

export const POST = async (
  req: MedusaRequest<AdminCreateDefaultShippingOptionType>,
  res: MedusaResponse
) => {
  // const carriers = await getAdminCarriersList(req.scope).run()

  res.send('To be implemented')
}
