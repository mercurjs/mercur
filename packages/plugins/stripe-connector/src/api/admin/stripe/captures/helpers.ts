import { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"

import { listPendingCaptures } from "../../../../pipeline/captures"
import { resolveConnector } from "../../../../utils/payout-module"

export async function retrievePendingCapture(container: MedusaContainer, orderGroupId: string) {
  const item = (await listPendingCaptures(container, resolveConnector(container).getOptions())).find(
    (capture) => capture.group.id === orderGroupId
  )
  if (!item) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `No pending capture for order group ${orderGroupId}`)
  }
  return item
}
