import { Heading, toast } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import {
  EditAttributeForm,
  ProductAttributeBatchPayload,
  RouteDrawer,
} from "@mercurjs/dashboard-shared";

import { useBatchProductAttributes, useProduct } from "../../../hooks/api/products";
import { useProductAttribute } from "../../../hooks/api/product-attributes";
import { PRODUCT_DETAIL_QUERY } from "../constants";

export const ProductEditAttribute = () => {
  const { id, attribute_id } = useParams();
  const { t } = useTranslation();

  const { product, isLoading, isError, error } = useProduct(
    id!,
    PRODUCT_DETAIL_QUERY,
  );

  const attached = (product as any)?.attributes?.find(
    (a: any) => a.id === attribute_id,
  );

  const {
    product_attribute: catalogAttribute,
    isLoading: isCatalogLoading,
    isError: isCatalogError,
    error: catalogError,
  } = useProductAttribute(attribute_id!, undefined, {
    enabled: !!attribute_id && !isLoading && !attached,
  });

  const { mutateAsync, isPending } = useBatchProductAttributes(id!);

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

  const onSubmit = async (payload: ProductAttributeBatchPayload) => {
    await mutateAsync(payload, {
      onError: (error) => toast.error(error.message),
    });
  };

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
          attribute={attribute}
          isAttached={isAttached}
          isPending={isPending}
          onSubmit={onSubmit}
        />
      )}
    </RouteDrawer>
  );
};
