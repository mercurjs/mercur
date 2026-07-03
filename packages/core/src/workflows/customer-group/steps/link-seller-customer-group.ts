import { Link } from "@medusajs/framework/modules-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

type LinkSellerCustomerGroupStepInput = {
  seller_id: string
  customer_group_ids: string[]
}

export const linkSellerCustomerGroupStep = createStep(
  "link-seller-customer-group",
  async (input: LinkSellerCustomerGroupStepInput, { container }) => {
    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.LINK)

    // Module order must match the `defineLink` order in
    // `links/seller-customer-group-link.ts` (customer group first, then seller).
    const links = input.customer_group_ids.map((customerGroupId) => ({
      [Modules.CUSTOMER]: {
        customer_group_id: customerGroupId,
      },
      [MercurModules.SELLER]: {
        seller_id: input.seller_id,
      },
    }))

    await remoteLink.create(links)

    return new StepResponse(undefined, {
      seller_id: input.seller_id,
      customer_group_ids: input.customer_group_ids,
    })
  },
  async (data, { container }) => {
    if (!data) return

    const remoteLink: Link = container.resolve(
      ContainerRegistrationKeys.REMOTE_LINK
    )

    const links = data.customer_group_ids.map((customerGroupId) => ({
      [Modules.CUSTOMER]: {
        customer_group_id: customerGroupId,
      },
      [MercurModules.SELLER]: {
        seller_id: data.seller_id,
      },
    }))

    await remoteLink.dismiss(links)
  }
)
