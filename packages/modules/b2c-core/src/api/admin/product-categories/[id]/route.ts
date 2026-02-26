import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntities
} from '@medusajs/framework';
import {
  HttpTypes,
  AdminProductCategoryResponse
} from '@medusajs/framework/types';
import { MedusaError } from '@medusajs/framework/utils';
import { defaultAdminCategoryDetailFields } from '../query-config';

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminProductCategoryListParams>,
  res: MedusaResponse<AdminProductCategoryResponse>
) => {
  const {
    data: [category]
  } = await refetchEntities({
    entity: 'product_category',
    idOrFilter: { id: req.params.id, ...req.filterableFields },
    scope: req.scope,
    fields: [
      ...req.queryConfig.fields,
      ...defaultAdminCategoryDetailFields.map(
        (field) => `category_detail.${field}`
      )
    ],
    pagination: req.queryConfig.pagination
  });

  if (!category) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product category with id: ${req.params.id} was not found`
    );
  }

  res.json({ product_category: category });
};
