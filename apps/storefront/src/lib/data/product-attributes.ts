'use server';

import type { ProductAttributeDTO } from '@mercurjs/types';

import { mercur } from '../mercur';

export const listProductAttributes = async ({
  category_id
}: {
  category_id?: string;
} = {}): Promise<ProductAttributeDTO[]> => {
  return mercur.store.productAttributes
    .query({
      category_id,
      fields: 'id,name,handle,type,is_variant_axis,rank,*values',
      limit: 100,
      fetchOptions: { cache: 'force-cache', next: { revalidate: 3600 } }
    } as Parameters<typeof mercur.store.productAttributes.query>[0])
    .then(({ product_attributes }) => product_attributes as ProductAttributeDTO[])
    .catch(() => []);
};
