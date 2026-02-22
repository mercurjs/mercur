import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import sellerStockLocationLink from "../../../links/seller-stock-location";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: sellerLinks } = await query.graph({
    entity: sellerStockLocationLink.entryPoint,
    fields: ["stock_location_id"],
  });

  const linkedStockLocationIds = sellerLinks.map(
    (link) => link.stock_location_id
  );

  const { data: stockLocations, metadata } = await query.graph({
    entity: "stock_location",
    fields: req.queryConfig.fields,
    filters: {
      ...req.filterableFields,
      ...(linkedStockLocationIds.length > 0 && {
        id: { $nin: linkedStockLocationIds },
      }),
    },
    pagination: req.queryConfig.pagination,
  });

  res.json({
    stock_locations: stockLocations,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take,
  });
}
