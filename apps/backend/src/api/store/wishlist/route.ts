import customerWishlist from '#/links/customer-wishlist'
import { calculateWishlistProductsPrice } from '#/modules/wishlist/utils'
import { createWishlistWorkflow } from '#/workflows/wishlist/workflows'

import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  container
} from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { StoreCreateWishlistType } from './validators'

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateWishlistType>,
  res: MedusaResponse
) => {
  const { result } = await createWishlistWorkflow.run({
    container: req.scope,
    input: {
      ...req.validatedBody,
      customer_id: req.auth_context.actor_id
    }
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [wishlist]
  } = await query.graph({
    entity: 'wishlist',
    fields: req.queryConfig.fields,
    filters: {
      id: result.id
    }
  })

  res.status(201).json({ wishlist })
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: wishlists, metadata } = await query.graph({
    entity: customerWishlist.entryPoint,
    fields: [
      ...req.queryConfig.fields.map((field) => `wishlist.products.${field}`),
      'wishlist.products.variants.prices.*'
    ],
    filters: {
      customer_id: req.auth_context.actor_id
    },
    pagination: req.queryConfig.pagination
  })

  const formattedWithPrices = await calculateWishlistProductsPrice(
    container,
    wishlists
  )

  res.json({
    wishlists: formattedWithPrices,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
