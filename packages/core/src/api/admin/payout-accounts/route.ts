import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { linkPayoutAccountWorkflow } from "../../../workflows/payout"
import { refetchPayoutAccount } from "./helpers"
import { AdminCreatePayoutAccountType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminPayoutAccountListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: payout_accounts, metadata } = await query.graph({
    entity: "payout_account",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    payout_accounts,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreatePayoutAccountType>,
  res: MedusaResponse<HttpTypes.AdminPayoutAccountResponse>
) => {
  const { result } = await linkPayoutAccountWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  const payout_account = await refetchPayoutAccount(result.id, req.scope, req.queryConfig.fields)

  res.status(201).json({ payout_account })
}
