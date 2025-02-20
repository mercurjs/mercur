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
      'collection.title ',
      'tags.value',
      'type.value',
      'variants.*',
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
  }

  return z.array(AlgoliaProductValidator).parse(products)
}
