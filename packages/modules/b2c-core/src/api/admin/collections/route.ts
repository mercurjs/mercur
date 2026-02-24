import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework';
import { HttpTypes } from '@medusajs/framework/types';
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString
} from '@medusajs/framework/utils';
import { defaultAdminCollectionFields } from '@medusajs/medusa/api/admin/collections/query-config';

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminCollectionListParams>,
  res: MedusaResponse<HttpTypes.AdminCollectionListResponse>
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY);

  const query = remoteQueryObjectFromString({
    entryPoint: 'product_collection',
    variables: {
      filters: req.filterableFields,
      ...req.queryConfig.pagination
    },
    fields: [
      ...req.queryConfig.fields,
      ...defaultAdminCollectionFields.map(
        (field) => `collection_detail.${field}`
      )
    ]
  });

  const { rows: collections, metadata } = await remoteQuery(query);

  res.json({
    collections,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take
  });
};
