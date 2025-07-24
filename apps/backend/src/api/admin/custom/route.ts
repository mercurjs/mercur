import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const logger = req.scope.resolve('logger')
  logger.info('Database URL: ' + process.env.DATABASE_URL)
  res.sendStatus(200)
}
