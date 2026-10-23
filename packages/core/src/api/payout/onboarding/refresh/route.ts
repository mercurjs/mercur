import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import PayoutModuleService from "../../../../modules/payout/services/payout-module-service"
import { createOnboardingWorkflow } from "../../../../workflows/payout"

/**
 * Public refresh URL handed to the provider with every onboarding link: a
 * seller whose link expired lands here and is sent to a fresh one.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const token = typeof req.query.token === "string" ? req.query.token : null
  if (!token) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "token is required")
  }

  const service = req.scope.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const [account] = await service.listPayoutAccounts({ onboarding_token: token }, { take: 1 })
  if (!account) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Unknown onboarding token")
  }

  const { result } = await createOnboardingWorkflow(req.scope).run({
    input: { account_id: account.id, data: {}, context: {} },
  })

  const url = (result.data?.url as string | undefined) ?? service.getOptions().onboarding.returnUrl
  res.redirect(302, url)
}
