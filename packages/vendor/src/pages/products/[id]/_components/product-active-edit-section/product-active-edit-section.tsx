import { Button, toast, usePrompt } from "@medusajs/ui"
import { ProductChangeStatus } from "@mercurjs/types"
import {
  ProductChangePanel,
  type ProductChangeAttribute,
  type ProductChangeProduct,
  type ProductChangeResolvers,
  type ProductChangeVariant,
} from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"

import { useCancelProductEdit, useProductChange } from "@hooks/api/products"
import { sdk } from "@lib/client"

type VariantInfo = {
  id: string
  title?: string | null
  sku?: string | null
  images?: { url: string }[] | null
}

type ProductForActiveEdit = {
  id: string
  title?: string | null
  thumbnail?: string | null
  variants?: (VariantInfo | null)[] | null
  attributes?: ProductChangeAttribute[] | null
}

type ProductActiveEditSectionProps = {
  product: ProductForActiveEdit
}

const VARIANT_LOOKUP_FIELDS = "id,title,sku,*images"

const resolversFor = (productId: string): ProductChangeResolvers => ({
  getType: async (id) => {
    const { product_type } = await sdk.vendor.productTypes.$id.query({ $id: id })
    return product_type?.value ?? null
  },
  getCollection: async (id) => {
    const { collection } = await sdk.vendor.collections.$id.query({ $id: id })
    return collection?.title ?? null
  },
  getCategory: async (id) => {
    const { product_category } = await sdk.vendor.productCategories.$id.query({
      $id: id,
    })
    return product_category?.name ?? null
  },
  getTag: async (id) => {
    const { product_tag } = await sdk.vendor.productTags.$id.query({ $id: id })
    return product_tag?.value ?? null
  },
  getAttribute: async (id) => {
    const { product_attribute } = await sdk.vendor.productAttributes.$id.query({
      $id: id,
    })
    if (!product_attribute) return null
    return {
      name: product_attribute.name ?? id,
      values: (product_attribute.values ?? []).map((v) => ({
        id: v.id,
        name: v.name ?? v.id,
      })),
    }
  },
  getVariant: async (variantId) => {
    const { variant } = await sdk.vendor.products.$id.variants.$variantId.query({
      $id: productId,
      $variantId: variantId,
      fields: VARIANT_LOOKUP_FIELDS,
    })
    return (variant as ProductChangeVariant) ?? null
  },
})

export const ProductActiveEditSection = ({
  product,
}: ProductActiveEditSectionProps) => {
  const { t } = useTranslation()
  const prompt = usePrompt()

  const { product_change, isError } = useProductChange(product.id, {
    retry: false,
  })

  const { mutateAsync: cancelEdit, isPending: isCanceling } =
    useCancelProductEdit(product.id)

  if (isError || !product_change) {
    return null
  }

  if (product_change.status !== ProductChangeStatus.PENDING) {
    return null
  }

  const onCancel = async () => {
    const confirmed = await prompt({
      title: t("products.edits.panel.cancelTitle"),
      description: t("products.edits.panel.cancelDescription"),
      confirmText: t("actions.confirm"),
      cancelText: t("actions.cancel"),
    })

    if (!confirmed) return

    try {
      await cancelEdit()
      toast.success(t("products.edits.toast.canceledSuccessfully"))
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const panelProduct: ProductChangeProduct = {
    id: product.id,
    title: product.title,
    thumbnail: product.thumbnail,
    variants: product.variants as ProductChangeVariant[] | undefined,
    attributes: product.attributes,
  }

  return (
    <ProductChangePanel
      product={panelProduct}
      actions={product_change.actions ?? []}
      resolvers={resolversFor(product.id)}
      footer={
        <Button
          size="small"
          variant="secondary"
          onClick={onCancel}
          disabled={isCanceling}
          isLoading={isCanceling}
          data-testid="product-active-edit-cancel-button"
        >
          {t("actions.cancel")}
        </Button>
      }
    />
  )
}
