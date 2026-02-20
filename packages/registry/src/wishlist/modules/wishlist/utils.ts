import { MedusaContainer } from "@medusajs/framework";

export async function getWishlistFromCustomerId(
  container: MedusaContainer,
  customerId: string
) {
  const knex = container.resolve("__pg_connection__");

  const wishlist = await knex("wishlist")
    .select("wishlist.id")
    .join(
      "customer_customer_wishlist_wishlist",
      "wishlist.id",
      "customer_customer_wishlist_wishlist.wishlist_id"
    )
    .where("customer_customer_wishlist_wishlist.customer_id", customerId)
    .first();

  return wishlist;
}
