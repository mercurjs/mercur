import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { MercurModules, PayoutModuleEvents } from "@mercurjs/types"

import PayoutModuleService from "../../../../modules/payout/services/payout-module-service"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { provider } = req.params
    const payoutService = req.scope.resolve<PayoutModuleService>(MercurModules.PAYOUT)
    const options = payoutService.getOptions()

    if (!payoutService.listProviderIds().includes(provider)) {
      res.status(404).send(`Unknown payout provider ${provider}`)
      return
    }

    const eventBus = req.scope.resolve(Modules.EVENT_BUS)

    await eventBus.emit(
      {
        name: PayoutModuleEvents.WEBHOOK_RECEIVED,
        data: {
          provider,
          payload: { data: req.body, rawData: req.rawBody, headers: req.headers },
        },
      },
      {
        delay: options.webhookDelay,
        attempts: options.webhookRetries,
      }
    )
  } catch (err) {
    res.status(400).send(`Webhook Error: ${(err as Error).message}`)
    return
  }

  res.sendStatus(200)
}
