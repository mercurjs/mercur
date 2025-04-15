import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

export async function GET(
  _req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  res.json({
    db_url: process.env.DATABASE_URL
  })
}
