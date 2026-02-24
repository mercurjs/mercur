import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http';
import { HttpTypes } from '@medusajs/framework/types';

import { ContainerRegistrationKeys } from '@medusajs/framework/utils';

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.StoreCollectionListParams>,
  res: MedusaResponse<HttpTypes.StoreCollectionListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: collections, metadata } = await query.graph(
    {
      entity: 'product_collection',
      filters: req.filterableFields,
      pagination: req.queryConfig.pagination,
      fields: [
        ...req.queryConfig.fields,
        'collection_detail.*',
        'collection_detail.media.id',
        'collection_detail.media.url',
        'collection_detail.media.alt_text'
      ]
    },
    {
      // @ts-expect-error - locale is not a valid option for remoteQueryObjectFromString
      locale: req.locale
    }
  );

  res.json({
    collections,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  });
};
