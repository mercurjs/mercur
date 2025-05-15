import { z } from 'zod'

import { MedusaContainer } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  arrayDifference
} from '@medusajs/framework/utils'

import sellerProduct from '../../../links/seller-product'
import { getAvgRating } from '../../reviews/utils'
import { AlgoliaProductValidator, AlgoliaVariantValidator } from '../types'

async function selectProductSupportedCountries(
  container: MedusaContainer,
  product_id: string
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [sellerProductRelation]
  } = await query.graph({
    entity: sellerProduct.entryPoint,
    fields: ['seller.service_zones.geo_zones.*'],
    filters: {
      product_id
    }
  })

  return sellerProductRelation
    ? sellerProductRelation.seller.service_zones.flatMap((sz) => {
        return sz && sz.geo_zones
          ? sz.geo_zones
              .filter((gz) => gz.type === 'country')
              .map((gz) => gz.country_code)
          : []
      })
    : []
}

async function selectProductSeller(
  container: MedusaContainer,
  product_id: string
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [product]
  } = await query.graph({
    entity: sellerProduct.entryPoint,
    fields: ['seller_id', 'seller.handle'],
    filters: {
      product_id
    }
  })

  return product
    ? { id: product.seller_id, handle: product.seller.handle }
    : null
}

export async function filterProductsByStatus(
  container: MedusaContainer,
  ids: string[] = []
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: 'product',
    fields: ['id', 'status'],
    filters: {
      id: ids
    }
  })

  const published = products.filter((p) => p.status === 'published')
  const other = arrayDifference(products, published)

  return {
    published: published.map((p) => p.id),
    other: other.map((p) => p.id)
  }
}

export async function findAndTransformAlgoliaProducts(
  container: MedusaContainer,
  ids: string[] = []
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: products } = await query.graph({
    entity: 'product',
    fields: [
      '*',
      'categories.name',
      'categories.id',
      'collection.title ',
      'tags.value',
      'type.value',
      'variants.*',
      'variants.options.*',
      'variants.options.prices.*',
      'variants.prices.*',
      'brand.name',
      'options.*',
      'options.values.*',
      'images.*'
    ],
    filters: ids.length
      ? {
          id: ids,
          status: 'published'
        }
      : { status: 'published' }
  })

  for (const product of products) {
    product.average_rating = await getAvgRating(
      container,
      'product',
      product.id
    )
    product.supported_countries = await selectProductSupportedCountries(
      container,
      product.id
    )
    product.seller = await selectProductSeller(container, product.id)

    product.options = product.options
      ?.map((option) => {
        return option.values.map((value) => {
          const entry = {}
          entry[option.title.toLowerCase()] = value.value
          return entry
        })
      })
      .flat()
    product.variants = z.array(AlgoliaVariantValidator).parse(product.variants)
    product.variants = product.variants
      ?.map((variant) => {
        return variant.options?.reduce((entry, item) => {
          entry[item.option.title.toLowerCase()] = item.value
          return entry
        }, variant)
      })
      .flat()
  }

  return z.array(AlgoliaProductValidator).parse(products)
}
