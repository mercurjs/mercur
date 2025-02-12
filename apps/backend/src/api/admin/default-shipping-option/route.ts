import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'

// id: model.id().primaryKey(),
// external_provider: model.text(),
// external_provider_id: model.text(),
// external_provider_option_name: model.text(),
// is_enabled: model.boolean().default(false)

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  // const carriers = await getAdminCarriersList(req.scope).run()
  const query = req.scope.resolve('query')

  const { data } = await query.graph({
    entity: 'default_shipping_option',
    fields: ['*']
  })
  res.json(data)
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  // const carriers = await getAdminCarriersList(req.scope).run()

  res.send('')
}
