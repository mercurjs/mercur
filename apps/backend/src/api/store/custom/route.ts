import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  res.sendStatus(200)
}
