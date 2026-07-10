import { Product, SortOptions } from '@/types/product';

/**
 * Helper function to sort products by price until the store API supports sorting by price
 * @param products
 * @param sortBy
 * @returns products sorted by price
 */
export function sortProducts(
  products: Product[],
  sortBy: SortOptions
): Product[] {
  if (['price_asc', 'price_desc'].includes(sortBy)) {
    // Sort products based on the precomputed minimum prices
    products.sort((a, b) => {
      const diff = a.price! - b.price!;
      return sortBy === 'price_asc' ? diff : -diff;
    });
  }

  if (sortBy === 'created_at') {
    products.sort((a, b) => {
      return (
        new Date(b.created_at!).getTime() -
        new Date(a.created_at!).getTime()
      );
    });
  }

  return products;
}
