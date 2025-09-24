import { MedusaService } from '@medusajs/framework/utils'

import { Wishlist } from './models/wishlist'

class WishlistModuleService extends MedusaService({
  Wishlist
}) {}

export default WishlistModuleService
