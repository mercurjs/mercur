import type {
  PriceDTO,
  PriceSetDTO,
  ProductDTO,
  ProductVariantDTO,
  RegionDTO
} from '@medusajs/framework/types'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'
import { StepResponse } from '@medusajs/framework/workflows-sdk'
import { addOrderLineItemsWorkflow } from '@medusajs/medusa/core-flows'

type VariantWithPricing = Pick<ProductVariantDTO, 'id' | 'title'> & {
  product?: Pick<ProductDTO, 'title'>
  price_set?: Pick<PriceSetDTO, 'id'> & {
    prices?: Pick<PriceDTO, 'currency_code'>[]
  }
}

type RegionWithCurrency = Pick<RegionDTO, 'id' | 'currency_code'>

/**
 * This hook provides the pricing context for adding line items to orders in RMA flows (claims, returns, exchanges).
 *
 * In a marketplace scenario, when an admin creates a claim and adds outbound (replacement) items,
 * the variant prices need to be calculated using the order's region context.
 *
 * This hook also validates that all variants have prices in the order's currency.
 * If any variant is missing a price, it throws a 400 error - this is a vendor responsibility.
 */
addOrderLineItemsWorkflow.hooks.setPricingContext(
  async (
    { order, variantIds, region, customerData, additional_data },
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const currencyCode = order?.currency_code || region?.currency_code

    if (variantIds?.length && currencyCode) {
      const { data: variants } = await query.graph({
        entity: 'variant',
        fields: [
          'id',
          'title',
          'product.title',
          'price_set.prices.currency_code'
        ],
        filters: {
          id: variantIds
        }
      })

      const variantsWithoutPrice: string[] = []

      for (const variant of variants as VariantWithPricing[]) {
        const prices = variant.price_set?.prices || []
        const currencyCodes = prices.map((p) => p.currency_code)

        if (!currencyCodes.includes(currencyCode)) {
          const productTitle = variant.product?.title || 'Unknown'
          const variantTitle = variant.title || variant.id
          variantsWithoutPrice.push(`${productTitle} - ${variantTitle}`)
        }
      }

      if (variantsWithoutPrice.length > 0) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `The following variants do not have a price in ${currencyCode.toUpperCase()}. ` +
            `Please ask the vendor to add prices for these products: ${variantsWithoutPrice.join(', ')}`
        )
      }
    }

    if (region?.id) {
      return new StepResponse({
        region_id: region.id,
        currency_code: region.currency_code
      })
    }

    if (order?.region_id) {
      const { data: regions } = await query.graph({
        entity: 'region',
        fields: ['id', 'currency_code'],
        filters: {
          id: order.region_id
        }
      })

      const orderRegion = (regions as RegionWithCurrency[])[0]

      if (orderRegion) {
        return new StepResponse({
          region_id: orderRegion.id,
          currency_code: orderRegion.currency_code
        })
      }
    }

    if (order?.currency_code) {
      return new StepResponse({
        currency_code: order.currency_code
      })
    }

    return new StepResponse({})
  }
)
