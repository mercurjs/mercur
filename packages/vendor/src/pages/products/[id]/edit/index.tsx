// Route: /products/:id/edit
import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { useLinkQuery } from "@mercurjs/dashboard-shared";

import { RouteDrawer } from "@components/modals";
import { useProduct } from "@hooks/api/products";
import { EditProductForm } from "./edit-product-form";

export const Component = () => {
  const { id } = useParams();
  const { t } = useTranslation();

  const query = useLinkQuery("product");
  const { product, isLoading, isError, error } = useProduct(id!, query);

  if (isError) {
    throw error;
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("products.edit.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("products.edit.description")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {!isLoading && product && <EditProductForm product={product} />}
    </RouteDrawer>
  );
};
