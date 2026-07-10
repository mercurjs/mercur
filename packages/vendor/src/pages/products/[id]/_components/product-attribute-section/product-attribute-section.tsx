import { toast } from "@medusajs/ui";
import {
  ProductAttributeSection as SharedProductAttributeSection,
} from "@mercurjs/dashboard-shared";
import { MercurFeatureFlags, ProductAttributeDTO } from "@mercurjs/types";
import { useTranslation } from "react-i18next";

import { useFeatureFlags, useProductAttributes } from "@hooks/api";
import { useBatchProductAttributes } from "@hooks/api/products";

type ProductWithAttributes = {
  id: string;
  attributes?: ProductAttributeDTO[] | null;
  categories?: { id?: string | null }[] | null;
};

export const ProductAttributeSection = ({
  product,
}: {
  product: ProductWithAttributes;
}) => {
  const { t } = useTranslation();

  const { feature_flags } = useFeatureFlags();
  const isProductRequestEnabled =
    !!feature_flags?.[MercurFeatureFlags.PRODUCT_REQUEST];

  const categoryId = product.categories?.[0]?.id;
  const { product_attributes } = useProductAttributes(
    { category_id: categoryId, is_required: true },
    { enabled: !!categoryId },
  );

  const { mutateAsync } = useBatchProductAttributes(product.id);

  const onDeleteAttribute = async (attribute: ProductAttributeDTO) => {
    try {
      await mutateAsync(
        { remove: [attribute.id] },
        {
          onSuccess: () => {
            toast.success(
              isProductRequestEnabled
                ? t("products.edit.requestSuccessToast")
                : t("products.edit.attributes.deleteSuccessToast"),
            );
          },
          onError: (error) => {
            toast.error(error.message);
          },
        },
      );
    } catch {
      // Error surfaced via the mutation's onError toast.
    }
  };

  return (
    <SharedProductAttributeSection
      product={product}
      requiredAttributes={product_attributes}
      onDeleteAttribute={onDeleteAttribute}
    />
  );
};
