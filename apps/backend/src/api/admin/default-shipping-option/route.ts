import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  // const carriers = await getAdminCarriersList(req.scope).run()
  const query = req.scope.resolve('query')

  const { data } = await query.graph({
    entity: 'default_shipping_option',
    fields: ['*']
  })
  res.json(data)
}
