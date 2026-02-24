import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { RouteDrawer } from "@components/modals";
import { useProduct } from "@hooks/api/products";
import { ProductEditVariantForm } from "./components/product-edit-variant-form";

export const ProductVariantEdit = () => {
  const { t } = useTranslation();
  const { product_id, variant_id } = useParams();

  const {
    product,
    isPending: isProductPending,
    isError: isProductError,
    error: productError,
  } = useProduct(product_id!);

  const variant = product?.variants?.find(
    (variant) => variant.id === variant_id,
  );

  const ready = !isProductPending && !!product;

  if (isProductError) {
    throw productError;
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t("products.variant.edit.header")}</Heading>
      </RouteDrawer.Header>
      {ready && <ProductEditVariantForm variant={variant} product={product} />}
    </RouteDrawer>
  );
};
