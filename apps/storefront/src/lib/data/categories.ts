import { HttpTypes } from '@medusajs/types';

import { sdk } from '@/lib/client';
import { CACHE_TAGS, getGlobalCacheOptions } from './cache-tags';

interface CategoriesProps {
  query?: Record<string, unknown>;
}

export const listCategories = async ({ query }: Partial<CategoriesProps> = {}) => {
  const limit = query?.limit || 100;

  const allCategories = await (sdk.store.productCategories
    .query({
      fields: 'id,handle,name,rank,metadata,parent_category_id,description,*category_children',
      include_descendants_tree: true,
      include_ancestors_tree: true,
      limit,
      ...query,
      fetchOptions: {
        cache: 'force-cache',
        next: getGlobalCacheOptions(CACHE_TAGS.categories)
      }
    } as never) as unknown as Promise<{ product_categories: HttpTypes.StoreProductCategory[] }>)
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
  return (sdk.store.productCategories
    .query({
      fields: 'id,name,handle,parent_category_id,*category_children',
      handle: categoryHandle,
      include_descendants_tree: true,
      fetchOptions: {
        cache: 'force-cache',
        next: getGlobalCacheOptions(
          CACHE_TAGS.categories,
          CACHE_TAGS.category(categoryHandle)
        )
      }
    } as never) as unknown as Promise<HttpTypes.StoreProductCategoryListResponse>)
    .then(({ product_categories }) => product_categories[0]);
};

// Medusa's `/store/products?category_id=` filters by the exact category only —
// it does not walk into descendants. To make a parent category page list every
// product beneath it, collect the whole subtree of ids and pass them all.
export const collectCategorySubtreeIds = (
  category: Pick<HttpTypes.StoreProductCategory, 'id' | 'category_children'>
): string[] => {
  const ids = [category.id];
  for (const child of category.category_children ?? []) {
    ids.push(...collectCategorySubtreeIds(child));
  }
  return ids;
};
