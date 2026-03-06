import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { RouteDrawer } from "../../../components/modals";
import { useProduct } from "../../../hooks/api/products";
import { ProductOrganizationForm } from "./components/product-organization-form";
import { PRODUCT_DETAIL_QUERY } from "../constants";

export const ProductOrganization = () => {
  const { id } = useParams();
  const { t } = useTranslation();

  const { product, isLoading, isError, error } = useProduct(id!, PRODUCT_DETAIL_QUERY);

  if (isError) {
    throw error;
  }

  return (
    <RouteDrawer data-testid="product-organization-drawer">
      <RouteDrawer.Header data-testid="product-organization-drawer-header">
        <RouteDrawer.Title
          asChild
          data-testid="product-organization-drawer-title"
        >
          <Heading data-testid="product-organization-drawer-title-text">
            {t("products.organization.edit.header")}
          </Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      {!isLoading && product && <ProductOrganizationForm product={product} />}
    </RouteDrawer>
  );
};
