import { MedusaContainer } from "@medusajs/framework";
import { IPricingModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

import { WishlistItem } from "@mercurjs/framework";

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

export async function calculateWishlistProductsPrice(
  container: MedusaContainer,
  wishlists: WishlistItem[]
) {
  const formattedWishlists = wishlists.map((relation) => {
    const wishlist = relation.wishlist;

    return {
      id: wishlist.id,
      products: wishlist.products.map((product) => {
        const { variants, ...productData } = product ?? {};
        const variant = variants?.[0] || null;
        const price = variant?.prices?.[0] || null;

        return {
          ...productData,
          variant_id: variant?.id,
          price_set_id: price?.price_set_id,
          currency_code: price?.currency_code,
        };
      }),
    };
  });
  const allProducts = formattedWishlists.flatMap(
    (wishlist) => wishlist.products
  );

  const priceSetIds = allProducts
    .map((p) => p.price_set_id)
    .filter(Boolean) as string[];

  const pricingModuleService = container.resolve<IPricingModuleService>(
    Modules.PRICING
  );

  const calculatedPrices = await pricingModuleService.calculatePrices(
    { id: priceSetIds },
    { context: { currency_code: allProducts[0]?.currency_code || "eur" } }
  );

  const calculatedPriceMap = new Map(
    calculatedPrices.map((price) => [price.id, price.calculated_amount])
  );

  return formattedWishlists.map((wishlist) => ({
    ...wishlist,
    products: wishlist.products.map((product) => ({
      ...product,
      calculated_amount:
        calculatedPriceMap.get(product.price_set_id as string) || null,
    })),
  }));
}
