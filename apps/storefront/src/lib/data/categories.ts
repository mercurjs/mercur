import { mercur } from '../mercur';

interface CategoriesProps {
  query?: Record<string, unknown>;
}

export const listCategories = async ({ query }: Partial<CategoriesProps> = {}) => {
  const limit = query?.limit || 100;

  const allCategories = await mercur.store.productCategories
    .query({
      fields: 'id,handle,name,rank,metadata,parent_category_id,description,*category_children',
      include_descendants_tree: true,
      include_ancestors_tree: true,
      limit,
      ...query,
      fetchOptions: { cache: 'force-cache', next: { revalidate: 3600 } }
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
  return mercur.store.productCategories
    .query({
      fields: '*category_children',
      handle: categoryHandle,
      fetchOptions: { cache: 'force-cache', next: { revalidate: 300 } }
    })
    .then(({ product_categories }) => product_categories[0]);
};
