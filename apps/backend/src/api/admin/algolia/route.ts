import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

import { ALGOLIA_MODULE, AlgoliaModuleService } from '@mercurjs/algolia'
import { IndexType } from '@mercurjs/framework'

import { syncAlgoliaWorkflow } from '../../../workflows/algolia/workflows'

/**
 * @oas [post] /admin/algolia
 * operationId: "AdminSyncAlgolia"
 * summary: "Sync Algolia"
 * description: "Initiates a synchronization process for Algolia indices."
 * x-authenticated: true
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               description: Confirmation message that sync is in progress
 *               example: "Sync in progress"
 * tags:
 *   - Admin Algolia
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  await syncAlgoliaWorkflow.run({
    container: req.scope
  })

  res.status(200).json({ message: 'Sync in progress' })
}

/**
 * @oas [get] /admin/algolia
 * operationId: "AdminGetAlgoliaStatus"
 * summary: "Get Algolia Status"
 * description: "Retrieves the current status of Algolia configuration and product index."
 * x-authenticated: true
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             appId:
 *               type: string
 *               description: The Algolia application ID
 *               example: "YOUR_ALGOLIA_APP_ID"
 *             productIndex:
 *               type: object
 *               description: The status of the product index
 *               properties:
 *                 exists:
 *                   type: boolean
 *                   description: Whether the product index exists
 *                 name:
 *                   type: string
 *                   description: The name of the product index
 * tags:
 *   - Admin Algolia
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const algoliaService = req.scope.resolve<AlgoliaModuleService>(ALGOLIA_MODULE)

  const appId = algoliaService.getAppId()
  const productIndex = await algoliaService.checkIndex(IndexType.PRODUCT)
  res.status(200).json({ appId, productIndex })
}
