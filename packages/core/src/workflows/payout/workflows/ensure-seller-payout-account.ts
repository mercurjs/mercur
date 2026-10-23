import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import {
  ReturnWorkflow,
  StepResponse,
  WorkflowResponse,
  createStep,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"
import { createPayoutAccountWorkflow } from "./create-payout-account"
import { createOnboardingStep } from "../steps"

export type EnsureSellerPayoutAccountWorkflowInput = {
  seller_id: string
  provider_id?: string
}

type SellerSnapshot = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  website_url: string | null
  country_code: string | null
  is_company: boolean
  payout_ignored: boolean
  account: {
    id: string
    ignored: boolean
    details_submitted: boolean
    onboarding_token: string | null
    onboarding_url: string | null
    onboarding_kind: string | null
  } | null
}

const loadSellerStep = createStep(
  "load-seller-for-payout-account",
  async (input: { seller_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const {
      data: [seller],
    } = await query.graph({
      entity: "seller",
      fields: [
        "id",
        "name",
        "email",
        "phone",
        "website_url",
        "metadata",
        "address.country_code",
        "professional_details.corporate_name",
        "payout_account.id",
        "payout_account.ignored",
        "payout_account.details_submitted",
        "payout_account.onboarding_token",
        "payout_account.onboarding.data",
      ],
      filters: { id: input.seller_id },
    })

    if (!seller) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Seller ${input.seller_id} was not found`)
    }

    const account = seller.payout_account
    const onboardingData = (account?.onboarding?.data ?? null) as Record<string, unknown> | null

    const snapshot: SellerSnapshot = {
      id: seller.id,
      name: seller.name ?? null,
      email: seller.email ?? null,
      phone: seller.phone ?? null,
      website_url: seller.website_url ?? null,
      country_code: seller.address?.country_code ?? null,
      is_company: !!seller.professional_details?.corporate_name,
      payout_ignored: String(seller.metadata?.payout_ignored ?? "") === "true",
      account: account
        ? {
            id: account.id,
            ignored: !!account.ignored,
            details_submitted: !!account.details_submitted,
            onboarding_token: account.onboarding_token ?? null,
            onboarding_url: (onboardingData?.url as string | undefined) ?? null,
            onboarding_kind: (onboardingData?.kind as string | undefined) ?? null,
          }
        : null,
    }

    return new StepResponse(snapshot)
  }
)

const syncIgnoredStep = createStep(
  "sync-payout-account-ignored",
  async (input: { account_id: string; ignored: boolean }, { container }) => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
    const previous = await service.retrievePayoutAccount(input.account_id)
    if (previous.ignored === input.ignored) {
      return new StepResponse(previous, null)
    }
    const updated = await service.updatePayoutAccounts({ id: input.account_id, ignored: input.ignored })
    return new StepResponse(updated, { id: input.account_id, ignored: previous.ignored })
  },
  async (previous, { container }) => {
    if (!previous) return
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
    await service.updatePayoutAccounts(previous)
  }
)

const ensureOnboardingTokenStep = createStep(
  "ensure-onboarding-token",
  async (input: { account_id: string }, { container }) => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
    const account = await service.retrievePayoutAccount(input.account_id)
    if (account.onboarding_token) {
      return new StepResponse(account.onboarding_token)
    }
    const token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
    await service.updatePayoutAccounts({ id: input.account_id, onboarding_token: token })
    return new StepResponse(token)
  }
)

export const ensureSellerPayoutAccountWorkflowId = "ensure-seller-payout-account"

/**
 * For one seller: create
 * the provider account when missing, mirror the ignored flag, and publish an
 * onboarding link until the seller has finished onboarding.
 */
export type EnsureSellerPayoutAccountWorkflowOutput = {
  account_id: string | null
  onboarding_published: boolean
}

export const ensureSellerPayoutAccountWorkflow: ReturnWorkflow<
  EnsureSellerPayoutAccountWorkflowInput,
  EnsureSellerPayoutAccountWorkflowOutput,
  []
> = createWorkflow(
  ensureSellerPayoutAccountWorkflowId,
  function (input: EnsureSellerPayoutAccountWorkflowInput) {
    const seller = loadSellerStep({ seller_id: input.seller_id })

    const created = when("create-missing-account", { seller }, ({ seller }) => !seller.account).then(() => {
      return createPayoutAccountWorkflow.runAsStep({
        input: {
          seller_id: input.seller_id,
          provider_id: input.provider_id,
          seller: {
            id: seller.id,
            name: seller.name,
            email: seller.email,
            phone: seller.phone,
            website_url: seller.website_url,
            country_code: seller.country_code,
            is_company: seller.is_company,
          },
          data: {},
          context: {},
        },
      })
    })

    const accountId = transform({ seller, created }, ({ seller, created }) =>
      seller.account?.id ?? created?.id ?? null
    )

    const needsOnboardingLink = transform({ seller, created }, ({ seller, created }) => {
      if (created) return true
      const account = seller.account
      if (!account || account.details_submitted) return false
      return !account.onboarding_url || account.onboarding_kind !== "login"
    })

    when("sync-ignored", { seller }, ({ seller }) => !!seller.account).then(() => {
      syncIgnoredStep({ account_id: seller.account!.id, ignored: seller.payout_ignored })
    })

    when(
      "publish-onboarding-link",
      { needsOnboardingLink, accountId },
      ({ needsOnboardingLink, accountId }) => needsOnboardingLink && !!accountId
    ).then(() => {
      ensureOnboardingTokenStep({ account_id: accountId as unknown as string })
      createOnboardingStep({ account_id: accountId as unknown as string, data: {}, context: {} })
    })

    const output = transform({ accountId, needsOnboardingLink }, ({ accountId, needsOnboardingLink }) => ({
      account_id: accountId,
      onboarding_published: needsOnboardingLink && !!accountId,
    }))

    return new WorkflowResponse(output)
  }
)
