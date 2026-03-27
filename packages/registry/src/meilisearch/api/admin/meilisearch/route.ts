import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'

import { MEILISEARCH_MODULE, MeilisearchModuleService } from '../../../modules/meilisearch'
import { IndexType } from '../../../modules/meilisearch/types'
import { syncMeilisearchWorkflow } from '../../../workflows/meilisearch/workflows/sync-meilisearch'

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await syncMeilisearchWorkflow.run({
    container: req.scope,
  })

  res.status(200).json({ message: 'Sync in progress' })
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const meilisearch =
    req.scope.resolve<MeilisearchModuleService>(MEILISEARCH_MODULE)

  const host = meilisearch.getHost()
  const { documentCount, isHealthy } = await meilisearch.getStatus()

  res.status(200).json({
    host,
    index: IndexType.PRODUCT,
    documentCount,
    isHealthy,
  })
}
