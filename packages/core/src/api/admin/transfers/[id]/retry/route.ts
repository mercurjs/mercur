import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { HttpTypes, MercurModules, TransferStatus } from "@mercurjs/types"

import PayoutModuleService from "../../../../../modules/payout/services/payout-module-service"
import { processTransferWorkflow } from "../../../../../workflows/payout"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminTransferResponse>
) => {
  const service = req.scope.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const current = await service.retrieveTransfer(req.params.id)

  if (![TransferStatus.FAILED, TransferStatus.ON_HOLD, TransferStatus.PENDING].includes(current.status)) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Transfer ${current.id} is ${current.status} and cannot be retried`)
  }

  await service.updateTransfers({ id: current.id, status: TransferStatus.PENDING, status_reason: null })
  await processTransferWorkflow(req.scope).run({ input: { transfer_id: current.id } })

  const {
    data: [transfer],
  } = await query.graph({
    entity: "transfer",
    fields: req.queryConfig.fields,
    filters: { id: current.id },
  })

  res.json({ transfer })
}
