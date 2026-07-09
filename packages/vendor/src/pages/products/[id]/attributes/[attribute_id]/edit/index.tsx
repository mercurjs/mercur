// Route: /products/:id/attributes/:attribute_id/edit
import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { useLinkQuery } from "@mercurjs/dashboard-shared";

import { RouteDrawer } from "@components/modals";
import { useProduct } from "@hooks/api/products";
import { PRODUCT_DETAIL_QUERY } from "../../../../common/constants";
import { EditAttributeForm } from "./components/edit-attribute-form";

export const Component = () => {
  const { id, attribute_id } = useParams();
  const { t } = useTranslation();

  const query = useLinkQuery("product", PRODUCT_DETAIL_QUERY.fields);
  const { product, isLoading, isError, error } = useProduct(id!, query);

  if (isError) {
    throw error;
  }

  const attribute = (product as any)?.attributes?.find(
    (a: any) => a.id === attribute_id,
  );

  const ready = !isLoading && !!product && !!attribute;

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("products.editAttribute")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("products.editAttributeHint")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && (
        <EditAttributeForm productId={id!} attribute={attribute} />
      )}
    </RouteDrawer>
  );
};
