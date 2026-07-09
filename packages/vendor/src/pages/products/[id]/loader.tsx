import { LoaderFunctionArgs } from "react-router-dom";
import { getLinkQuery } from "@mercurjs/dashboard-shared";

import { productsQueryKeys } from "@hooks/api/products";
import { sdk } from "@lib/client";
import { queryClient } from "@lib/query-client";
import { PRODUCT_DETAIL_QUERY } from "../common/constants";

/** Custom-fields `link` relations merged into the detail query (`+link.*`). */
export const productDetailQueryWithLinks = () =>
  getLinkQuery("product", PRODUCT_DETAIL_QUERY.fields);

const productDetailQuery = (id: string) => {
  const query = productDetailQueryWithLinks();
  return {
    queryKey: productsQueryKeys.detail(id, query),
    queryFn: async () =>
      sdk.vendor.products.$id.query({
        $id: id,
        ...query,
      } as any),
  };
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const query = productDetailQuery(id!);

  const response = await queryClient.ensureQueryData({
    ...query,
    staleTime: 90000,
  });

  return response;
};
