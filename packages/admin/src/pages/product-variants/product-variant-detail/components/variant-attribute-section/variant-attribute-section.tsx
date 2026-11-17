import { toast } from "@medusajs/ui";
import {
  VariantAttributeSection as SharedVariantAttributeSection,
  useCan,
} from "@mercurjs/dashboard-shared";
import { ProductAttributeDTO } from "@mercurjs/types";
import { useTranslation } from "react-i18next";

import { useBatchVariantAttributes } from "../../../../../hooks/api/products";

type VariantWithAttributes = {
  id: string;
  product_id?: string | null;
  attributes?: ProductAttributeDTO[] | null;
};

export const VariantAttributeSection = ({
  variant,
  productId,
}: {
  variant: VariantWithAttributes;
  productId: string;
}) => {
  const { t } = useTranslation();
  const canViewAttributes = useCan("product_attributes");
  const { mutateAsync } = useBatchVariantAttributes(productId, variant.id);

  const onDeleteAttribute = async (attribute: ProductAttributeDTO) => {
    try {
      await mutateAsync(
        { remove: [attribute.id] },
        {
          onSuccess: () => {
            toast.success(t("products.variant.attributes.deleteSuccessToast"));
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

  if (!canViewAttributes) {
    return null;
  }

  return (
    <SharedVariantAttributeSection
      variant={variant}
      onDeleteAttribute={onDeleteAttribute}
    />
  );
};
