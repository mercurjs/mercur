import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { HttpTypes } from "@mercurjs/types";

import { AdminGetSellerProductsParamsType } from "../../validators";

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetSellerProductsParamsType>,
  res: MedusaResponse<HttpTypes.AdminProductListResponse>,
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: sellerProducts, metadata } = await query.graph({
    entity: "product_seller",
    fields: ["product_id"],
    filters: {
      seller_id: req.params.id,
    },
    pagination: req.queryConfig.pagination,
  });

  const productIds = sellerProducts.map((entry) => entry.product_id);

  if (!productIds.length) {
    return res.json({
      products: [],
      count: 0,
      offset: metadata?.skip ?? 0,
      limit: metadata?.take ?? 0,
    });
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: {
      ...req.filterableFields,
      id: productIds,
    },
  });

  res.json({
    products,
    count: metadata?.count ?? products.length,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  });
};
