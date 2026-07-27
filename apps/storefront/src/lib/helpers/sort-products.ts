import { HttpTypes } from '@medusajs/types';
import { SortOptions } from '@/types/product';

interface MinPricedProduct extends HttpTypes.StoreProduct {
  _minPrice?: number;
}

// Sorts by price client-side until the store API supports ordering by price.
export function sortProducts(
  products: HttpTypes.StoreProduct[],
  sortBy: SortOptions
): HttpTypes.StoreProduct[] {
  const sortedProducts = products as MinPricedProduct[];

  if (['price_asc', 'price_desc'].includes(sortBy)) {
    sortedProducts.forEach((product) => {
      if (product.variants && product.variants.length > 0) {
        product._minPrice = Math.min(
          ...product.variants.map(
            (variant) =>
              variant?.calculated_price
                ?.calculated_amount || 0
          )
        );
      } else {
        product._minPrice = Infinity;
      }
    });

    sortedProducts.sort((a, b) => {
      const diff = a._minPrice! - b._minPrice!;
      return sortBy === 'price_asc' ? diff : -diff;
    });
  }

  if (sortBy === 'created_at') {
    sortedProducts.sort((a, b) => {
      return (
        new Date(b.created_at!).getTime() -
        new Date(a.created_at!).getTime()
      );
    });
  }

  return sortedProducts;
}
