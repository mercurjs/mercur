import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

import { inviteSellerWorkflow } from '../../../../workflows/seller/workflows'
import { AdminInviteSellerType } from '../validators'

export async function POST(
  req: MedusaRequest<AdminInviteSellerType>,
  res: MedusaResponse
): Promise<void> {
  const { result: invitation } = await inviteSellerWorkflow.run({
    container: req.scope,
    input: req.validatedBody
  })

  res.status(201).json({ invitation })
}
