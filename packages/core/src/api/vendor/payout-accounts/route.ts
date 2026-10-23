import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import {
  createPayoutAccountWorkflow,
  ensureSellerPayoutAccountWorkflow,
} from "../../../workflows/payout"
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
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id

  const { result } = await createPayoutAccountWorkflow(req.scope).run({
    input: {
      seller_id: sellerId,
      data: req.validatedBody.data,
      context: req.validatedBody.context,
    },
  })

  // Publish the onboarding link right away instead of waiting for the sync
  // job; a provider that cannot issue one yet leaves the account usable and
  // the seller can refresh the link later.
  await ensureSellerPayoutAccountWorkflow(req.scope).run({
    input: { seller_id: sellerId },
    throwOnError: false,
  })

  const {
    data: [payout_account],
  } = await query.graph({
    entity: "payout_account",
    fields: req.queryConfig.fields,
    filters: { id: result.id },
  })

  res.status(201).json({ payout_account })
}
