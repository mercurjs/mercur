import { toast } from "@medusajs/ui"
import {
  VariantAttributeSection as SharedVariantAttributeSection,
  useCan,
} from "@mercurjs/dashboard-shared"
import { MercurFeatureFlags, ProductAttributeDTO } from "@mercurjs/types"
import { useTranslation } from "react-i18next"

import { useFeatureFlags } from "@hooks/api"
import { useBatchVariantAttributes } from "@hooks/api/products"

type VariantWithAttributes = {
  id: string
  attributes?: ProductAttributeDTO[] | null
}

export const VariantAttributeSection = ({
  variant,
  productId,
}: {
  variant: VariantWithAttributes
  productId: string
}) => {
  const { t } = useTranslation()
  const canViewAttributes = useCan("product_attributes")

  const { feature_flags } = useFeatureFlags()
  const isProductRequestEnabled =
    !!feature_flags?.[MercurFeatureFlags.PRODUCT_REQUEST]

  const { mutateAsync } = useBatchVariantAttributes(productId, variant.id)

  const onDeleteAttribute = async (attribute: ProductAttributeDTO) => {
    try {
      await mutateAsync(
        { remove: [attribute.id] },
        {
          onSuccess: () => {
            toast.success(
              isProductRequestEnabled
                ? t("products.edit.requestSuccessToast")
                : t("products.variant.attributes.deleteSuccessToast")
            )
          },
          onError: (error) => {
            toast.error(error.message)
          },
        }
      )
    } catch {
      // Error surfaced via the mutation's onError toast.
    }
  }

  if (!canViewAttributes) {
    return null
  }

  return (
    <SharedVariantAttributeSection
      variant={variant}
      onDeleteAttribute={onDeleteAttribute}
    />
  )
}
