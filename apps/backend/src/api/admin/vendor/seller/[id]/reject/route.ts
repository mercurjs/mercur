import { rejectSellerWorkflow } from '#/workflows/seller/workflows/reject-seller'

import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  await rejectSellerWorkflow(req.scope).run({ input: { id: req.params.id } })

  res.json({ message: `Vendor ${req.params.id} approved` })
}
