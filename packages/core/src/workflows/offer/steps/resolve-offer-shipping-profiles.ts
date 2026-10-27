import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"

export const resolveOfferShippingProfilesStepId =
  "resolve-offer-shipping-profiles"

export type ResolveOfferShippingProfilesStepInput = {
  offers: { variant_id: string; shipping_profile_id?: string | null }[]
  variants: { id: string; product?: { id: string } | null }[]
}

type CategoryNode = {
  id: string
  parent_category_id: string | null
  default_shipping_profile?: { id: string } | null
}

/**
 * Returns one shipping profile id per offer, aligned by index: the offer's own
 * profile, else the nearest product category (walking up the tree) that has a
 * default profile, else the store's default shipping profile.
 */
export const resolveOfferShippingProfilesStep = createStep(
  resolveOfferShippingProfilesStepId,
  async (
    { offers, variants }: ResolveOfferShippingProfilesStepInput,
    { container }
  ) => {
    if (offers.every((offer) => !!offer.shipping_profile_id)) {
      return new StepResponse(
        offers.map((offer) => offer.shipping_profile_id as string)
      )
    }

    const productByVariant = new Map(
      variants.map((variant) => [variant.id, variant.product?.id])
    )

    const unresolvedProductIds = Array.from(
      new Set(
        offers
          .filter((offer) => !offer.shipping_profile_id)
          .map((offer) => productByVariant.get(offer.variant_id))
          .filter((id): id is string => !!id)
      )
    )

    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const profileByProduct = new Map<string, string>()

    if (unresolvedProductIds.length) {
      const { data: products } = await query.graph({
        entity: "product",
        fields: ["id", "categories.id"],
        filters: { id: unresolvedProductIds },
      })

      const categoriesByProduct = new Map<string, string[]>(
        (products as { id: string; categories?: { id: string }[] | null }[]).map(
          (product) => [
            product.id,
            (product.categories ?? []).map((category) => category.id).sort(),
          ]
        )
      )

      const nodes = new Map<string, CategoryNode>()
      let pending = Array.from(
        new Set(Array.from(categoriesByProduct.values()).flat())
      )
      while (pending.length) {
        const { data } = await query.graph({
          entity: "product_category",
          fields: ["id", "parent_category_id", "default_shipping_profile.id"],
          filters: { id: pending },
        })
        for (const node of data as CategoryNode[]) {
          nodes.set(node.id, node)
        }
        pending = Array.from(
          new Set(
            (data as CategoryNode[])
              .map((node) => node.parent_category_id)
              .filter((id): id is string => !!id && !nodes.has(id))
          )
        )
      }

      for (const [productId, categoryIds] of categoriesByProduct) {
        let level = categoryIds
        const visited = new Set<string>()
        while (level.length) {
          const match = level
            .map((id) => nodes.get(id)?.default_shipping_profile?.id)
            .find((id): id is string => !!id)
          if (match) {
            profileByProduct.set(productId, match)
            break
          }
          level.forEach((id) => visited.add(id))
          level = Array.from(
            new Set(
              level
                .map((id) => nodes.get(id)?.parent_category_id)
                .filter((id): id is string => !!id && !visited.has(id))
            )
          ).sort()
        }
      }
    }

    let defaultProfileId: string | undefined
    const needsDefault = offers.some(
      (offer) =>
        !offer.shipping_profile_id &&
        !profileByProduct.has(productByVariant.get(offer.variant_id) ?? "")
    )
    if (needsDefault) {
      const fulfillmentService = container.resolve(Modules.FULFILLMENT)
      const [defaultProfile] = await fulfillmentService.listShippingProfiles(
        { type: "default" },
        { take: 1 }
      )
      defaultProfileId = defaultProfile?.id
    }

    return new StepResponse(
      offers.map((offer) => {
        const resolved =
          offer.shipping_profile_id ??
          profileByProduct.get(productByVariant.get(offer.variant_id) ?? "") ??
          defaultProfileId
        if (!resolved) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `No shipping profile could be resolved for variant ${offer.variant_id}`
          )
        }
        return resolved
      })
    )
  }
)
