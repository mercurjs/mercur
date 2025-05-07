import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { WISHLIST_MODULE } from '../../../modules/wishlist'
import WishlistModuleService from '../../../modules/wishlist/service'
import { CreateWishlistDTO } from '../../../modules/wishlist/types/mutations'
import { getWishlistFromCustomerId } from '../../../modules/wishlist/utils'

export const createWishlistEntryStep = createStep(
  'create-wishlist',
  async (input: CreateWishlistDTO, { container }) => {
    const service = container.resolve<WishlistModuleService>(WISHLIST_MODULE)
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    let wishlist = await getWishlistFromCustomerId(container, input.customer_id)
    if (!wishlist) {
      wishlist = await service.createWishlists(input)
      link.create([
        {
          [Modules.CUSTOMER]: {
            customer_id: input.customer_id
          },
          [WISHLIST_MODULE]: {
            wishlist_id: wishlist.id
          }
        }
      ])
    }

    await link.create([
      {
        [WISHLIST_MODULE]: {
          wishlist_id: wishlist.id
        },
        [Modules.PRODUCT]: {
          product_id: input.reference_id
        }
      }
    ])
    return new StepResponse(wishlist)
  }
)
