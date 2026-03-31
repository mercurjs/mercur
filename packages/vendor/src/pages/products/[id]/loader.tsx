import { LoaderFunctionArgs } from "react-router-dom";

import { productsQueryKeys } from "@hooks/api/products";
import { sdk } from "@lib/client";
import { queryClient } from "@lib/query-client";

export const PRODUCT_DETAIL_FIELDS = [
  "*variants.inventory_items",
  "*variants.images",
  "*categories",
  "+additional_data",
  "+attribute_values.*",
  "+attribute_values.attribute.*",
  "+options.*",
  "+options.values.*",
].join(",");

const productDetailQuery = (id: string) => ({
  queryKey: productsQueryKeys.detail(id, { fields: PRODUCT_DETAIL_FIELDS }),
  queryFn: async () =>
    sdk.vendor.products.$id.query({
      $id: id,
      fields: PRODUCT_DETAIL_FIELDS,
    } as any),
});

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const query = productDetailQuery(id!);

  const response = await queryClient.ensureQueryData({
    ...query,
    staleTime: 90000,
  });

  return response;
};
