import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  res.json({
    db_url: process.env.DATABASE_URL,
    db_name: process.env.DB_NAME
  })
}
