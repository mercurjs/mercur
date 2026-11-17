import { Heading, toast } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import {
  EditAttributeAttribute,
  EditAttributeForm,
  ProductAttributeBatchPayload,
  RouteDrawer,
  SectionNoAccess,
  isForbidden,
  useCan,
} from "@mercurjs/dashboard-shared";

import {
  useBatchVariantAttributes,
  useProductVariant,
  VariantAttributeBatchPayload,
} from "../../../hooks/api/products";
import { VariantAttributeBatchAdd } from "@mercurjs/types";
import { useProductAttribute } from "../../../hooks/api/product-attributes";

export const ProductVariantEditAttribute = () => {
  const { id, variant_id, attribute_id } = useParams();
  const { t } = useTranslation();
  const canViewAttributes = useCan("product_attributes");

  const { variant, isLoading, isError, error } = useProductVariant(
    id!,
    variant_id!,
  );

  const attached = (
    variant as { attributes?: EditAttributeAttribute[] } | undefined
  )?.attributes?.find((a) => a.id === attribute_id);

  const {
    product_attribute: catalogAttribute,
    isLoading: isCatalogLoading,
    isError: isCatalogError,
    error: catalogError,
  } = useProductAttribute(attribute_id!, undefined, {
    enabled: !!attribute_id && !isLoading && !attached && canViewAttributes,
  });

  const { mutateAsync, isPending } = useBatchVariantAttributes(
    id!,
    variant_id!,
  );

  if (isError) {
    throw error;
  }
  if (isCatalogError && !isForbidden(catalogError)) {
    throw catalogError;
  }

  const fallbackAttribute: EditAttributeAttribute | undefined = catalogAttribute
    ? {
        id: catalogAttribute.id,
        name: catalogAttribute.name,
        type: catalogAttribute.type,
        is_variant_axis: false,
        is_required: !!catalogAttribute.is_required,
        is_scoped: false,
        values: [],
        all_values: (catalogAttribute.values ?? []).map((v) => ({
          id: v.id,
          name: v.name,
        })),
      }
    : undefined;

  const attribute = attached ?? fallbackAttribute;
  const isAttached = !!attached;

  const ready =
    !isLoading && !!variant && !!attribute && (!!attached || !isCatalogLoading);

  const noAccess =
    !isLoading && !!variant && !attached && (!canViewAttributes || isCatalogError);

  const onSubmit = async (payload: ProductAttributeBatchPayload) => {
    // The shared form only emits catalog (`id`) entries for a non-scoped
    // attribute, which is the only shape the variant endpoint accepts.
    const variantPayload: VariantAttributeBatchPayload = {
      add: payload.add?.filter(
        (entry): entry is VariantAttributeBatchAdd => "id" in entry
      ),
      remove: payload.remove,
      update: payload.update,
    };
    await mutateAsync(variantPayload, {
      onSuccess: () => {
        toast.success(t("products.variant.attributes.updateSuccessToast"));
      },
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
          {t("products.variant.attributes.editHint")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {noAccess && <SectionNoAccess />}
      {ready && (
        <EditAttributeForm
          attribute={attribute!}
          isAttached={isAttached}
          isPending={isPending}
          onSubmit={onSubmit}
        />
      )}
    </RouteDrawer>
  );
};
