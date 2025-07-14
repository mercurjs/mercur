import { MedusaService } from "@medusajs/framework/utils";

import { Wishlist } from "./models/wishlist";

/**
 * @class WishlistModuleService
 * @description Represents the wishlist module service.
 *
 * This service provides functionality for managing wishlists.
 */
class WishlistModuleService extends MedusaService({
  Wishlist,
}) {}

export default WishlistModuleService;
