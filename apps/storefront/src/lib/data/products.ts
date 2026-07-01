'use cache';

import { HttpTypes } from '@mercurjs/types';
import { cacheLife, cacheTag } from 'next/cache';

import { sortProducts } from '@/lib/helpers/sort-products';
import { SortOptions } from '@/types/product';
import { SellerProps } from '@/types/seller';

import { CACHE_TAGS } from '../cache/cache-tags';
import { EXPIRE, REVALIDATE } from '../cache/constants';
import { sdk } from '../config';
import { getRegion, retrieveRegion } from './regions';

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
  category_id,
  collection_id
}: {
  pageParam?: number;
  queryParams?: HttpTypes.FindParams &
    HttpTypes.StoreProductParams & {
      handle?: string[];
    };
  category_id?: string;
  collection_id?: string;
  countryCode?: string;
  regionId?: string;
}): Promise<{
  response: {
    products: (HttpTypes.StoreProduct & { seller?: SellerProps })[];
    count: number;
  };
  nextPage: number | null;
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams;
}> => {
  cacheTag(CACHE_TAGS.products);
  cacheLife({ revalidate: REVALIDATE, expire: EXPIRE });

  if (!countryCode && !regionId) {
    throw new Error('Country code or region ID is required');
  }

  const limit = queryParams?.limit || 12;
  const _pageParam = Math.max(pageParam, 1);
  const offset = (_pageParam - 1) * limit;

  let region: HttpTypes.StoreRegion | undefined | null;

  if (countryCode) {
    region = await getRegion(countryCode);
  } else {
    region = await retrieveRegion(regionId!);
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null
    };
  }

  return sdk.client
    .fetch<{
      products: (HttpTypes.StoreProduct & { seller?: SellerProps })[];
      count: number;
    }>(`/store/products`, {
      method: 'GET',
      query: {
        country_code: countryCode,
        category_id,
        collection_id,
        limit,
        offset,
        region_id: region?.id,
        fields:
          '*variants.calculated_price,+variants.inventory_quantity,*seller,*variants,*seller.products,' +
          '*seller.reviews,*seller.reviews.customer,*seller.reviews.seller,*seller.products.variants,*attribute_values,*attribute_values.attribute',
        ...queryParams
      }
    })
    .then(({ products: productsRaw, count }) => {
      const products = productsRaw.filter(product => product.seller?.store_status !== 'SUSPENDED');

      const nextPage = count > offset + limit ? pageParam + 1 : null;

      const response = products.filter(prod => {
        // @ts-ignore Property 'seller' exists but TypeScript doesn't recognize it
        const reviews = prod.seller?.reviews.filter(item => !!item) ?? [];
        return (
          // @ts-ignore Property 'seller' exists but TypeScript doesn't recognize it
          prod?.seller && {
            ...prod,
            seller: {
              // @ts-ignore Property 'seller' exists but TypeScript doesn't recognize it
              ...prod.seller,
              reviews
            }
          }
        );
      });

      return {
        response: {
          products: response,
          count
        },
        nextPage: nextPage,
        queryParams
      };
    })
    .catch(() => {
      return {
        response: {
          products: [],
          count: 0
        },
        nextPage: 0,
        queryParams
      };
    });
};

/**
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const listProductsWithSort = async ({
  page = 1,
  queryParams,
  sortBy = 'created_at',
  countryCode,
  category_id,
  seller_id,
  collection_id
}: {
  page?: number;
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams;
  sortBy?: SortOptions;
  countryCode: string;
  category_id?: string;
  seller_id?: string;
  collection_id?: string;
}): Promise<{
  response: {
    products: HttpTypes.StoreProduct[];
    count: number;
  };
  nextPage: number | null;
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams;
}> => {
  cacheTag(CACHE_TAGS.products);
  cacheLife({ revalidate: REVALIDATE, expire: EXPIRE });

  const limit = queryParams?.limit || 12;

  const {
    response: { products, count }
  } = await listProducts({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      limit: 100
    },
    category_id,
    collection_id,
    countryCode
  });

  const filteredProducts = seller_id
    ? products.filter(product => product.seller?.id === seller_id)
    : products;

  const pricedProducts = filteredProducts.filter(prod =>
    prod.variants?.some(variant => variant.calculated_price !== null)
  );

  const sortedProducts = sortProducts(pricedProducts, sortBy);

  const pageParam = (page - 1) * limit;

  const nextPage = count > pageParam + limit ? pageParam + limit : null;

  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit);

  return {
    response: {
      products: paginatedProducts,
      count
    },
    nextPage,
    queryParams
  };
};
