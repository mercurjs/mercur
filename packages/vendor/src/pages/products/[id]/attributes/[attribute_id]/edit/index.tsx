// Route: /products/:id/attributes/:attribute_id/edit
import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { useLinkQuery } from "@mercurjs/dashboard-shared";

import { RouteDrawer } from "@components/modals";
import { useProduct } from "@hooks/api/products";
import { useProductAttribute } from "@hooks/api/product-attributes";
import { PRODUCT_DETAIL_QUERY } from "../../../../common/constants";
import { EditAttributeForm } from "./components/edit-attribute-form";

export const Component = () => {
  const { id, attribute_id } = useParams();
  const { t } = useTranslation();

  const query = useLinkQuery("product", PRODUCT_DETAIL_QUERY.fields);
  const { product, isLoading, isError, error } = useProduct(id!, query);

  const attached = product?.attributes?.find((a) => a.id === attribute_id);

  const {
    product_attribute: catalogAttribute,
    isLoading: isCatalogLoading,
    isError: isCatalogError,
    error: catalogError,
  } = useProductAttribute(attribute_id!, undefined, {
    enabled: !!attribute_id && !isLoading && !attached,
  });

  if (isError) {
    throw error;
  }
  if (isCatalogError) {
    throw catalogError;
  }

  const fallbackAttribute = catalogAttribute
    ? {
        id: catalogAttribute.id,
        name: catalogAttribute.name,
        handle: (catalogAttribute as any).handle ?? null,
        type: catalogAttribute.type,
        is_variant_axis: !!(catalogAttribute as any).is_variant_axis,
        is_required: !!(catalogAttribute as any).is_required,
        is_scoped: false,
        values: [],
        all_values: (catalogAttribute.values ?? []).map((v: any) => ({
          id: v.id,
          name: v.name,
        })),
      }
    : undefined;

  const attribute = attached ?? fallbackAttribute;
  const isAttached = !!attached;

  const ready =
    !isLoading && !!product && !!attribute && (!!attached || !isCatalogLoading);

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
        <EditAttributeForm
          productId={id!}
          attribute={attribute}
          isAttached={isAttached}
        />
      )}
    </RouteDrawer>
  );
};
