// Route: /products/:id
import { UIMatch } from "react-router-dom";
import { LoaderFunctionArgs } from "react-router-dom";

import { useProduct } from "@hooks/api";
import { productsQueryKeys } from "@hooks/api/products";
import { sdk } from "@lib/client";
import { queryClient } from "@lib/query-client";
import { ExtendedAdminProductResponse } from "@custom-types/products";

import { ProductDetailPage } from "./product-detail-page";

// Loader
const productDetailQuery = (id: string) => ({
  queryKey: productsQueryKeys.detail(id),
  queryFn: async () => sdk.vendor.products.$id.query({ $id: id }),
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

// Breadcrumb
type ProductDetailBreadcrumbProps = UIMatch<ExtendedAdminProductResponse>;

export const Breadcrumb = (props: ProductDetailBreadcrumbProps) => {
  const { id } = props.params || {};

  const { product } = useProduct(id!);

  if (!product) {
    return null;
  }

  return <span>{product?.title}</span>;
};

// Main component
export const Component = () => {
  return <ProductDetailPage />;
};
