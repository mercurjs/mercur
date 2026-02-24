import { useProduct } from "@/hooks/api/products";
import { UIMatch } from "react-router-dom";

type ProductDetailBreadcrumbProps = UIMatch<ExtendedAdminProductResponse>;

export const Breadcrumb = (props: ProductDetailBreadcrumbProps) => {
  const { id } = props.params || {};

  const { product } = useProduct(id!);

  if (!product) {
    return null;
  }

  return <span>{product?.title}</span>;
};
