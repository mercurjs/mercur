import { MedusaContainer } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export default async function dailyPayouts(container: MedusaContainer) {
  const orderService = container.resolve(Modules.ORDER)

  // todo: push events to queue
}

export const config = {
  name: 'daily-payouts',
  schedule: '0 0 * * *' // Every day at midnight
}
