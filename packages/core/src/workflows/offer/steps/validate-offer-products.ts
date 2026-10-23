import { createStep } from "@medusajs/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  MedusaError,
  ProductStatus,
} from "@medusajs/framework/utils"

export const validateOfferProductsStepId = "validate-offer-products"

export type ValidateOfferProductsStepInput = {
  offers: { seller_id: string; variant_id: string }[]
  variants: {
    id: string
    product?: { id: string; status?: string } | null
  }[]
}

/**
 * The product–seller link is an allowlist: once a product has any link, only
 * the linked sellers may sell it. Vendor read routes already honour that; the
 * offer itself did not, so a seller who knew a variant id could list a product
 * restricted to others, or one the operator had rejected.
 */
export const validateOfferProductsStep = createStep(
  validateOfferProductsStepId,
  async ({ offers, variants }: ValidateOfferProductsStepInput, { container }) => {
    const productByVariant = new Map(
      variants.map((variant) => [variant.id, variant.product ?? null])
    )
    const productIds = Array.from(
      new Set(
        offers
          .map((offer) => productByVariant.get(offer.variant_id)?.id)
          .filter((id): id is string => !!id)
      )
    )
    if (!productIds.length) {
      return
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: links } = await query.graph({
      entity: "product_seller",
      fields: ["product_id", "seller_id"],
      filters: { product_id: productIds },
    })

    const sellersByProduct = new Map<string, Set<string>>()
    for (const link of links as { product_id: string | null; seller_id: string | null }[]) {
      if (!link.product_id || !link.seller_id) {
        continue
      }
      if (!sellersByProduct.has(link.product_id)) {
        sellersByProduct.set(link.product_id, new Set())
      }
      sellersByProduct.get(link.product_id)!.add(link.seller_id)
    }

    for (const offer of offers) {
      const product = productByVariant.get(offer.variant_id)
      if (!product) {
        continue
      }
      if (product.status === ProductStatus.REJECTED) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Product ${product.id} was rejected and cannot be offered`
        )
      }
      const allowed = sellersByProduct.get(product.id)
      if (allowed && !allowed.has(offer.seller_id)) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Product ${product.id} is restricted to other sellers`
        )
      }
    }
  }
)
