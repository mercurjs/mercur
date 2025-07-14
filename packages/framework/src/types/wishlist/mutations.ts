/**
 * *
 * @interface
 * 
 * The wishlist to be created.
 * @property {"product"} reference - The reference of the wishlist
 * @property {string} reference_id - The associated reference's ID.
 * @property {string} customer_id - The associated customer's ID.

 */
export type CreateWishlistDTO = {
  /**
 * *
 * The reference of the wishlist

 */
  reference: "product";
  /**
 * *
 * The associated reference's ID.

 */
  reference_id: string;
  /**
 * *
 * The associated customer's ID.

 */
  customer_id: string;
};

/**
 * *
 * @interface
 * 
 * The wishlist to be deleted.
 * @property {string} id - The ID of the wishlist.
 * @property {string} reference_id - The associated reference's ID.

 */
export type DeleteWishlistDTO = {
  /**
 * *
 * The ID of the wishlist.

 */
  id: string;
  /**
 * *
 * The associated reference's ID.

 */
  reference_id: string;
};
