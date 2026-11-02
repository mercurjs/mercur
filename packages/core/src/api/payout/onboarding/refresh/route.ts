import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { refreshOnboardingWorkflow } from "../../../../workflows/payout"

/**
 * Public refresh URL handed to the provider with every onboarding link: a
 * seller whose link expired lands here and is sent to a fresh one.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const token = req.query.token
  if (typeof token !== "string" || !token) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "token is required")
  }

  const { result } = await refreshOnboardingWorkflow(req.scope).run({
    input: { token },
  })

  res.redirect(302, result.url)
}
