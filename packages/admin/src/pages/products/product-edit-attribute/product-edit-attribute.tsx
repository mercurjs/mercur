import { Heading, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { RouteDrawer } from "../../../components/modals";
import { useProduct } from "../../../hooks/api/products";
import { PRODUCT_DETAIL_QUERY } from "../constants";
import { EditAttributeForm } from "./components/edit-attribute-form";

export const ProductEditAttribute = () => {
  const { id, attribute_id } = useParams();
  const { t } = useTranslation();

  const { product, isLoading, isError, error } = useProduct(
    id!,
    PRODUCT_DETAIL_QUERY,
  );

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
        <RouteDrawer.Description asChild>
          <Text size="small" className="text-ui-fg-subtle">
            {t("products.editAttributeHint")}
          </Text>
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && (
        <EditAttributeForm productId={id!} attribute={attribute} />
      )}
    </RouteDrawer>
  );
};
