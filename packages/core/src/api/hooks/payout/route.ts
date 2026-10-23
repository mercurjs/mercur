import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { MercurModules, PayoutModuleEvents } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"

/**
 * Legacy webhook URL: routes to the one enabled non-system provider so
 * existing dashboard configurations keep working. New set-ups should point
 * at `/hooks/payout/:provider`.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const payoutService = req.scope.resolve<PayoutModuleService>(MercurModules.PAYOUT)
    const options = payoutService.getOptions()
    const provider = payoutService.getDefaultProviderId()

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
