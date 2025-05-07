import { Module } from '@medusajs/framework/utils'

import WishlistModuleService from './service'

export const WISHLIST_MODULE = 'wishlist'

export default Module(WISHLIST_MODULE, {
  service: WishlistModuleService
})
