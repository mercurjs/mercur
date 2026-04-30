import { LoaderFunctionArgs } from "react-router-dom";

import { productsQueryKeys } from "@hooks/api/products";
import { sdk } from "@lib/client";
import { queryClient } from "@lib/query-client";
import { PRODUCT_DETAIL_QUERY } from "../common/constants";

const productDetailQuery = (id: string) => ({
  queryKey: productsQueryKeys.detail(id, PRODUCT_DETAIL_QUERY),
  queryFn: async () =>
    sdk.vendor.products.$id.query({
      $id: id,
      ...PRODUCT_DETAIL_QUERY,
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
