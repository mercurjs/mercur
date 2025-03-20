import { SellerDTO } from '#/modules/seller/types'

import { AuthContext, MedusaContainer } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'

export const fetchSellerByAuthActorId = async (
  authActorId: string,
  scope: MedusaContainer,
  fields: string[] = ['id']
): Promise<SellerDTO> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [seller]
  } = await query.graph({
    entity: 'seller',
    filters: {
      members: {
        id: authActorId
      }
    },
    fields
  })
  return seller
}

export const fetchSellerByAuthContext = async (
  ctx: AuthContext,
  scope: MedusaContainer,
  fields: string[] = ['id']
): Promise<SellerDTO> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  if (ctx.actor_type === 'seller') {
    return fetchSellerByAuthActorId(ctx.actor_id, scope, fields)
  }

  if (ctx.actor_type === 'seller-api-key') {
    const {
      data: [api_key]
    } = await query.graph({
      entity: 'seller_api_key',
      fields: ['seller_id'],
      filters: {
        id: ctx.actor_id
      }
    })

    const {
      data: [seller]
    } = await query.graph({
      entity: 'seller',
      filters: {
        id: api_key.seller_id
      },
      fields
    })

    return seller
  }

  throw new MedusaError(MedusaError.Types.UNAUTHORIZED, 'Invalid actor type!')
}
