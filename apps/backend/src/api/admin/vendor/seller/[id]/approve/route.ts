import { approveSellerWorkflow } from '#/workflows/seller/workflows/approve-seller'

import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  await approveSellerWorkflow(req.scope).run({ input: { id: req.params.id } })

  res.json({ message: `Vendor ${req.params.id} approved` })
}
