import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

import { ALGOLIA_MODULE, AlgoliaModuleService } from '../../../modules/algolia'
import { IndexType } from '../../../modules/algolia/types'
import { syncAlgoliaWorkflow } from '../../../workflows/algolia/workflows/sync-algolia'

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  await syncAlgoliaWorkflow.run({
    container: req.scope,
  })

  res.status(200).json({ message: 'Sync in progress' })
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const algoliaService =
    req.scope.resolve<AlgoliaModuleService>(ALGOLIA_MODULE)

  const appId = algoliaService.getAppId()
  const productIndex = await algoliaService.checkIndex(IndexType.PRODUCT)
  res.status(200).json({ appId, productIndex })
}
