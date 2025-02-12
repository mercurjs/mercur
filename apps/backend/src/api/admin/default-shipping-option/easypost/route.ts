import { getEasyPostOptions } from '#/workflows/default-shipping-options/workflows'

import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { result } = await getEasyPostOptions(req.scope).run()
  res.json(result)
}
