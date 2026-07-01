'use cache';

import { HttpTypes } from '@mercurjs/types';
import { cacheLife, cacheTag } from 'next/cache';

import { CACHE_TAGS, categoryTag } from '@/lib/cache/cache-tags';
import { EXPIRE, REVALIDATE } from '@/lib/cache/constants';
import { sdk } from '@/lib/config';

interface CategoriesProps {
  query?: Record<string, unknown>;
}

export const listCategories = async ({ query }: Partial<CategoriesProps> = {}) => {
  cacheTag(CACHE_TAGS.categories);
  cacheLife({ revalidate: REVALIDATE, expire: EXPIRE });

  const limit = query?.limit || 100;

  const allCategories = await sdk.client
    .fetch<{
      product_categories: HttpTypes.StoreProductCategory[];
    }>('/store/product-categories', {
      query: {
        fields: 'id,handle,name,rank,metadata,parent_category_id,description,*category_children',
        include_descendants_tree: true,
        include_ancestors_tree: true,
        limit,
        ...query
      }
    })
    .then(({ product_categories }) => product_categories);

  const parentCategories = allCategories.filter(cat => !cat.parent_category_id);

  const mainCategories = parentCategories.flatMap(parent => parent.category_children || []);

  const mainCategoriesWithChildren = mainCategories.map(mainCat => {
    const children = allCategories.filter(cat => cat.parent_category_id === mainCat.id);

    if (children.length > 0) {
      return {
        ...mainCat,
        category_children: children
      };
    }

    return mainCat;
  });

  return {
    parentCategories,
    categories: mainCategoriesWithChildren
  };
};

export const getCategoryByHandle = async (categoryHandle: string) => {
  cacheTag(CACHE_TAGS.categories, categoryTag(categoryHandle));
  cacheLife({ revalidate: REVALIDATE, expire: EXPIRE });

  return sdk.client
    .fetch<HttpTypes.StoreProductCategoryListResponse>(`/store/product-categories`, {
      query: {
        fields: '*category_children',
        handle: categoryHandle
      }
    })
    .then(({ product_categories }) => product_categories[0]);
};
