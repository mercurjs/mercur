import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { HttpTypes, MercurModules } from "@mercurjs/types"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { WorkflowResponse, createStep, createWorkflow, StepResponse } from "@medusajs/framework/workflows-sdk"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"
import { syncPayoutAccountWorkflow } from "../../../workflows/payout"
import { AdminCreatePayoutAccountType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminPayoutAccountListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { seller_id, ...filters } = req.filterableFields as Record<string, unknown>
  if (seller_id) {
    filters.seller = { id: seller_id }
  }

  const { data: payout_accounts, metadata } = await query.graph({
    entity: "payout_account",
    fields: req.queryConfig.fields,
    filters,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    payout_accounts,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

const mapExistingAccountStep = createStep(
  "map-existing-payout-account",
  async (input: AdminCreatePayoutAccountType, { container }) => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: existing } = await query.graph({
      entity: "seller_payout_account",
      fields: ["payout_account_id"],
      filters: { seller_id: input.seller_id },
    })
    if (existing.length) {
      throw new MedusaError(MedusaError.Types.CONFLICT, `Seller ${input.seller_id} already has a payout account`)
    }

    const account = await service.createPayoutAccounts({
      provider_id: input.provider_id,
      provider_account_id: input.provider_account_id,
      data: { id: input.provider_account_id },
    })

    return new StepResponse(account, account.id)
  },
  async (accountId, { container }) => {
    if (!accountId) return
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
    await service.deletePayoutAccounts(accountId)
  }
)

const mapExistingPayoutAccountWorkflow = createWorkflow(
  "map-existing-payout-account",
  function (input: AdminCreatePayoutAccountType) {
    const account = mapExistingAccountStep(input)

    createRemoteLinkStep([
      {
        [MercurModules.SELLER]: { seller_id: input.seller_id },
        [MercurModules.PAYOUT]: { payout_account_id: account.id },
      },
    ])

    syncPayoutAccountWorkflow.runAsStep({
      input: { account_id: account.id, seller_id: input.seller_id },
    })

    return new WorkflowResponse(account)
  }
)

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreatePayoutAccountType>,
  res: MedusaResponse<HttpTypes.AdminPayoutAccountResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await mapExistingPayoutAccountWorkflow(req.scope).run({
    input: req.validatedBody,
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
