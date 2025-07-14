import {
  PriceDTO,
  ProductDTO,
  ProductVariantDTO,
} from "@medusajs/framework/types";

/**
 * @interface
 * The wishlist product variant details.
 * @property {PriceDTO[]} prices - The prices of the wishlist product variant
 */
export interface WishlistProductVariantDTO extends ProductVariantDTO {
  /**
 * *
 * The prices of the wishlist product variant

 */
  prices: PriceDTO[];
}

/**
 * @interface
 * The wishlist product variants details.
 * @property {WishlistProductVariantDTO[]} variants - The wishlist product variants details.
 */
export interface WishlistProduct extends ProductDTO {
  /**
 * *
 * The wishlist product variants details.

 */
  variants: WishlistProductVariantDTO[];
}

/**
 * *
 * @interface
 * 
 * The wishlist details.
 * @property {string} id - The ID of the wishlist.
 * @property {WishlistProduct[]} products - The products of the wishlist

 */
export type Wishlist = {
  /**
 * *
 * The ID of the entity.

 */
  id: string;
  /**
 * *
 * The list of SUMMARY

 */
  products: WishlistProduct[];
};

/**
 * *
 * @interface
 * 
 * The wishlist item details.
 * @property {string} wishlist_id - The associated wishlist's ID.
 * @property {Wishlist} wishlist - The wishlist of the wishlist item

 */
export type WishlistItem = {
  /**
 * *
 * The associated wishlist's ID.

 */
  wishlist_id: string;
  /**
 * *
 * SUMMARY

 */
  wishlist: Wishlist;
};

export type WishlistResponse = WishlistItem[];
