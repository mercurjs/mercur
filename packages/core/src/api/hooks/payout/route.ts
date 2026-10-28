import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { PayoutModuleEvents } from "@mercurjs/types"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const eventBus = req.scope.resolve(Modules.EVENT_BUS)

    await eventBus.emit(
      {
        name: PayoutModuleEvents.WEBHOOK_RECEIVED,
        data: { data: req.body, rawData: req.rawBody, headers: req.headers },
      },
      {
        delay: 5000,
        attempts: 3,
      }
    )
  } catch (err) {
    res.status(400).send(`Webhook Error: ${(err as Error).message}`)
    return
  }

  res.sendStatus(200)
}
