import { WorkflowResponse, createWorkflow, transform } from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { CreatePayoutAccountDTO, MercurModules, PayoutProviderInput } from "@mercurjs/types"

import { createOnboardingStep, createPayoutAccountStep, validateSellerWithoutPayoutAccountStep } from "../steps"

export type CreatePayoutAccountWorkflowInput = PayoutProviderInput & {
  seller_id: string
}

export const createPayoutAccountWorkflowId = "create-payout-account-workflow"

/**
 * Creates the seller's account at the payout provider, prefilled from the
 * seller's profile, links it to the seller and publishes the onboarding link.
 */
export const createPayoutAccountWorkflow = createWorkflow(
  createPayoutAccountWorkflowId,
  function (input: CreatePayoutAccountWorkflowInput) {
    const { data: seller } = useQueryGraphStep({
      entity: "seller",
      fields: [
        "id",
        "name",
        "email",
        "phone",
        "website_url",
        "address.country_code",
        "professional_details.corporate_name",
        "payout_account.id",
      ],
      filters: { id: input.seller_id },
      options: { isList: false, throwIfKeyNotFound: true },
    }).config({ name: "payout-account-seller-query" })

    validateSellerWithoutPayoutAccountStep({ seller })

    const accountInput = transform({ input, seller }, ({ input, seller }): CreatePayoutAccountDTO => ({
      data: input.data ?? {},
      context: input.context ?? {},
      seller: {
        id: seller.id,
        name: seller.name ?? null,
        email: seller.email ?? null,
        phone: seller.phone ?? null,
        website_url: seller.website_url ?? null,
        country_code: seller.address?.country_code ?? null,
        is_company: !!seller.professional_details?.corporate_name,
      },
    }))

    const payoutAccount = createPayoutAccountStep(accountInput)

    createRemoteLinkStep([
      {
        [MercurModules.SELLER]: { seller_id: input.seller_id },
        [MercurModules.PAYOUT]: { payout_account_id: payoutAccount.id },
      },
    ])

    createOnboardingStep(transform({ payoutAccount }, ({ payoutAccount }) => ({ account_id: payoutAccount.id })))

    return new WorkflowResponse(payoutAccount)
  }
)
