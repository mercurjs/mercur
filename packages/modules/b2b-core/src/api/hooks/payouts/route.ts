import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { Modules } from '@medusajs/framework/utils'

import { PayoutWebhookEvents } from '@mercurjs/framework'

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const eventBus = req.scope.resolve(Modules.EVENT_BUS)

  await eventBus.emit(
    {
      name: PayoutWebhookEvents.ACCOUNT_WEBHOOK_RECEIVED,
      data: {
        data: req.body,
        rawData: req.rawBody,
        headers: req.headers
      }
    },
    {
      delay: 5000,
      attempts: 3
    }
  )

  res.sendStatus(200)
}
