import { useState } from "react"
import { Button, Text, toast } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { ProductChangeStatus, SellerDTO } from "@mercurjs/types"
import {
  ProductChangePanel,
  type ProductChangeAttribute,
  type ProductChangeProduct,
  type ProductChangeResolvers,
  type ProductChangeVariant,
} from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"

import { ConfirmPrompt } from "../../../../../components/common/confirm-prompt"
import {
  useCancelProductChange,
  useConfirmProductChange,
  useProductChange,
} from "../../../../../hooks/api/products"
import { useSeller } from "../../../../../hooks/api/sellers"
import { sdk } from "../../../../../lib/client"

type ProductWithSellers = HttpTypes.AdminProduct & {
  sellers?: SellerDTO[]
  attributes?: ProductChangeAttribute[]
}

type ProductActiveEditSectionProps = {
  product: ProductWithSellers
}

const VARIANT_LOOKUP_FIELDS = "id,title,sku,*images"

const resolversFor = (productId: string): ProductChangeResolvers => ({
  getType: async (id) => {
    const { product_type } = await sdk.admin.productTypes.$id.query({ $id: id })
    return product_type?.value ?? null
  },
  getCollection: async (id) => {
    const { collection } = await sdk.admin.collections.$id.query({ $id: id })
    return collection?.title ?? null
  },
  getCategory: async (id) => {
    const { product_category } = await sdk.admin.productCategories.$id.query({
      $id: id,
    })
    return product_category?.name ?? null
  },
  getTag: async (id) => {
    const { product_tag } = await sdk.admin.productTags.$id.query({ $id: id })
    return product_tag?.value ?? null
  },
  getAttribute: async (id) => {
    const { product_attribute } = await sdk.admin.productAttributes.$id.query({
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
    const { variant } = await sdk.admin.products.$id.variants.$variantId.query({
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

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)

  const { product_change, isError } = useProductChange(product.id, {
    retry: false,
  })

  const requesterId = product_change?.created_by ?? ""
  const { seller: requesterSeller } = useSeller(requesterId, undefined, {
    enabled: !!requesterId,
  })

  const { mutateAsync: confirmChange, isPending: isConfirming } =
    useConfirmProductChange(product_change?.id ?? "", product.id)
  const { mutateAsync: cancelChange, isPending: isRejecting } =
    useCancelProductChange(product_change?.id ?? "", product.id)

  if (isError || !product_change) {
    return null
  }

  if (product_change.status !== ProductChangeStatus.PENDING) {
    return null
  }

  const handleConfirm = async (note: string | undefined) => {
    try {
      await confirmChange({ internal_note: note })
      toast.success(t("products.edits.toast.confirmedSuccessfully"))
      setConfirmOpen(false)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const handleReject = async (note: string | undefined) => {
    try {
      await cancelChange({ internal_note: note })
      toast.success(t("products.edits.toast.rejectedSuccessfully"))
      setRejectOpen(false)
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
    <>
      <ProductChangePanel
        product={panelProduct}
        actions={product_change.actions ?? []}
        resolvers={resolversFor(product.id)}
        headerDescription={
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {t("products.edits.panel.description", {
              store:
                requesterSeller?.name ?? t("products.request.fallbackStore"),
            })}
          </Text>
        }
        footer={
          <>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setConfirmOpen(true)}
              data-testid="product-active-edit-confirm-button"
            >
              {t("actions.confirm")}
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setRejectOpen(true)}
              data-testid="product-active-edit-reject-button"
            >
              {t("products.edits.actions.reject")}
            </Button>
          </>
        }
      />

      <ConfirmPrompt
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("products.edits.confirmPrompt.title")}
        description={t("products.edits.confirmPrompt.description")}
        noteLabel={t("products.edits.confirmPrompt.noteLabel")}
        noteOptional
        notePlaceholder={t("products.edits.confirmPrompt.notePlaceholder")}
        isLoading={isConfirming}
        onConfirm={handleConfirm}
      />

      <ConfirmPrompt
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title={t("products.edits.rejectPrompt.title")}
        description={t("products.edits.rejectPrompt.description")}
        noteLabel={t("products.edits.rejectPrompt.noteLabel")}
        noteOptional
        notePlaceholder={t("products.edits.rejectPrompt.notePlaceholder")}
        confirmLabel={t("products.edits.rejectPrompt.confirm")}
        isLoading={isRejecting}
        onConfirm={handleReject}
      />
    </>
  )
}
