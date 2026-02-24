import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http';
import {
  StoreProductCategoryListParams,
  StoreProductCategoryListResponse
} from '@medusajs/framework/types';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';

export const GET = async (
  req: AuthenticatedMedusaRequest<StoreProductCategoryListParams>,
  res: MedusaResponse<StoreProductCategoryListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: product_categories, metadata } = await query.graph(
    {
      entity: 'product_category',
      fields: [
        ...req.queryConfig.fields,
        'category_detail.*',
        'category_detail.media.id',
        'category_detail.media.url',
        'category_detail.media.alt_text'
      ],
      filters: req.filterableFields,
      pagination: req.queryConfig.pagination
    },
    {
      // @ts-expect-error - locale is not a valid option for remoteQueryObjectFromString
      locale: req.locale
    }
  );

  res.json({
    product_categories,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  });
};
