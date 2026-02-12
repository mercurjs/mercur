// Route: /products/:id/shipping-profile
import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { RouteDrawer } from "@components/modals";
import { useProduct } from "@hooks/api/products";
import { ProductShippingProfileForm } from "./product-organization-form";

export const Component = () => {
  const { id } = useParams();
  const { t } = useTranslation();

  const { product, isLoading, isError, error } = useProduct(id!);

  if (isError) {
    throw error;
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("products.shippingProfile.edit.header")}</Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      {!isLoading && product && (
        <ProductShippingProfileForm product={product} />
      )}
    </RouteDrawer>
  );
};
