import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { createPayoutAccountWorkflow } from "../../../workflows/payout"
import { refetchPayoutAccount } from "./helpers"
import { VendorCreatePayoutAccountType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorPayoutAccountListResponse>
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
  req: AuthenticatedMedusaRequest<VendorCreatePayoutAccountType>,
  res: MedusaResponse<HttpTypes.VendorPayoutAccountResponse>
) => {
  const { result } = await createPayoutAccountWorkflow(req.scope).run({
    input: {
      seller_id: req.seller_context!.seller_id,
      data: req.validatedBody.data,
      context: req.validatedBody.context,
    },
  })

  const payout_account = await refetchPayoutAccount(result.id, req.scope, req.queryConfig.fields)

  res.status(201).json({ payout_account })
}
