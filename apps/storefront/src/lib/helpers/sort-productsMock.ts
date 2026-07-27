import { Product, SortOptions } from '@/types/product';

// Sorts by price client-side until the store API supports ordering by price.
export function sortProducts(
  products: Product[],
  sortBy: SortOptions
): Product[] {
  if (['price_asc', 'price_desc'].includes(sortBy)) {
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
