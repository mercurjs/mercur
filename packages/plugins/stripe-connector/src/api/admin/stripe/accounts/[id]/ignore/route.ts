import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { updateSellersWorkflow } from "@mercurjs/core/workflows"

import { PAYOUT_IGNORED_KEY } from "../../../../../../types/common"
import { AdminPayoutAccountResponse } from "../../../../../../types/http"
import { AdminIgnoreAccountType } from "../../../../validators"

/**
 * Ignored sellers keep their payout account, but the transfers job never
 * pays their orders out.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminIgnoreAccountType>,
  res: MedusaResponse<AdminPayoutAccountResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [account],
  } = await query.graph({
    entity: "payout_account",
    fields: ["id", "seller.id", "seller.metadata"],
    filters: { id: req.params.id },
  })
  const seller = account?.seller
  if (!seller) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Payout account ${req.params.id} has no seller`)
  }

  await updateSellersWorkflow(req.scope).run({
    input: {
      selector: { id: seller.id },
      update: {
        metadata: {
          ...((seller.metadata ?? {}) as Record<string, unknown>),
          [PAYOUT_IGNORED_KEY]: String(req.validatedBody.ignored),
        },
      },
    },
  })

  const {
    data: [payout_account],
  } = await query.graph({
    entity: "payout_account",
    fields: ["*", "seller.id", "seller.name", "seller.handle", "seller.metadata"],
    filters: { id: req.params.id },
  })

  res.json({ payout_account })
}
