import { z } from 'zod'

import { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { getAvgRating } from '../../reviews/utils'
import { AlgoliaProductValidator } from '../types'

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
      'options.values.*'
    ],
    filters: ids.length
      ? {
          id: ids
        }
      : {}
  })

  for (const product of products) {
    product.average_rating = await getAvgRating(
      container,
      'product',
      product.id
    )
    product.options = product.options
      ?.map((option) => {
        return option.values.map((value) => {
          const entry = {}
          entry[option.title.toLowerCase()] = value.value
          return entry
        })
      })
      .flat()
    product.variants = product.variants
      ?.map((variant) => {
        return variant.options?.reduce(
          (entry, item) => {
            entry[item.option.title.toLowerCase()] = item.value
            return entry
          },
          {
            title: variant.title,
            prices: variant.prices
          }
        )
      })
      .flat()
  }

  return z.array(AlgoliaProductValidator).parse(products)
}
