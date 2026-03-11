import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework';

import { fetchSellerByAuthActorId } from '../../../../shared/infra/http/utils';
import { exportSellerProductsWorkflow } from '../../../../workflows/seller/workflows';
import { filterProductsBySeller, ProductFilters } from '../utils';
import { VendorExportProductsBodyType } from '../validators';

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorExportProductsBodyType>,
  res: MedusaResponse
) => {
  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  );

  const filters = req.validatedBody as VendorExportProductsBodyType | undefined;
  const hasFilters =
    filters && Object.values(filters).some((v) => v !== undefined);

  let productIds: string[] | undefined;

  if (hasFilters) {
    const { sales_channel_id, ...productFilters } = filters;
    const result = await filterProductsBySeller(
      req.scope,
      seller.id,
      0,
      1_000_000,
      sales_channel_id,
      undefined,
      productFilters as ProductFilters
    );
    productIds = result.productIds;
  }

  const { result: fileData } = await exportSellerProductsWorkflow.run({
    container: req.scope,
    input: { seller_id: seller.id, product_ids: productIds }
  });

  res.json({
    url: fileData.url
  });
};
