import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes, MercurModules, PayoutStatus, TransferStatus, TransferType } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"
import { ONBOARDING_CHECKPOINT, TRANSFERS_CHECKPOINT, listPendingCaptures } from "../../../workflows/payout/pipeline"
import { describePayoutJobs } from "../../utils/payout-jobs"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminPayoutStatusResponse>
) => {
  const service = req.scope.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const options = service.getOptions()

  const [providers, jobs, captures, transfers, reversals, payouts, onboarding, transfersCheckpoint, lastWebhook] =
    await Promise.all([
      service.listRegisteredPayoutProviders(),
      describePayoutJobs(req.scope),
      listPendingCaptures(req.scope),
      service.listTransfers({ status: TransferStatus.FAILED, type: [TransferType.ORDER, TransferType.TAX, TransferType.ADJUSTMENT_CREDIT, TransferType.ADJUSTMENT_DEBIT] }, { select: ["id"], take: null }),
      service.listTransfers({ status: TransferStatus.FAILED, type: TransferType.REFUND_REVERSAL }, { select: ["id"], take: null }),
      service.listPayouts({ status: PayoutStatus.FAILED }, { select: ["id"], take: null }),
      service.getCheckpoint(ONBOARDING_CHECKPOINT),
      service.getCheckpoint(TRANSFERS_CHECKPOINT),
      service.getCheckpoint("last_webhook_at"),
    ])

  res.json({
    providers,
    options: options as unknown as Record<string, unknown>,
    checkpoints: { onboarding, transfers: transfersCheckpoint },
    failed: {
      captures: captures.filter((item) => !!item.collection.metadata?.payout_capture_error).length,
      transfers: transfers.length,
      reversals: reversals.length,
      payouts: payouts.length,
    },
    last_webhook_at: lastWebhook ? new Date(lastWebhook) : null,
    jobs,
  })
}
