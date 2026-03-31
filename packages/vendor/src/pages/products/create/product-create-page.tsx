import { Children, ReactNode, useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { RouteFocusModal, StackedFocusModal, useStackedModal } from "@components/modals"
import { useSalesChannels } from "@hooks/api"
import { useStore } from "@hooks/api/store"

import { ProductCreateForm } from "./product-create-form/product-create-form"
import { ProductCreateDetailsForm } from "./product-create-details-form"
import { ProductCreateOrganizeForm } from "./product-create-organize-form"
import { ProductCreateVariantsForm } from "./product-create-variants-form"
import { ProductCreateInventoryKitForm } from "./product-create-inventory-kit-form"
import { VariantMediaView } from "./variant-media-view/variant-media-view"
import { TabbedForm } from "@components/tabbed-form"
import { HttpTypes } from "@mercurjs/types"

type MediaItem = {
  file?: File
  url?: string
  isThumbnail?: boolean
  id?: string
}

const ProductCreateFormWithModal = ({
  defaultChannel,
  store,
}: {
  defaultChannel?: HttpTypes.AdminSalesChannel
  store?: HttpTypes.AdminStore
}) => {
  const { setIsOpen } = useStackedModal()
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null)
  const [selectedVariantTitle, setSelectedVariantTitle] = useState<string | undefined>(undefined)
  const [selectedVariantMedia, setSelectedVariantMedia] = useState<MediaItem[] | undefined>(undefined)
  const [productMedia, setProductMedia] = useState<MediaItem[]>([])
  const saveVariantMediaRef = useRef<
    ((variantIndex: number, media: MediaItem[]) => void) | null
  >(null)

  const handleOpenMediaModal = useCallback(
    (
      variantIndex: number,
      variantTitle?: string,
      initialMedia?: MediaItem[],
      currentProductMedia?: MediaItem[]
    ) => {
      setSelectedVariantIndex(variantIndex)
      setSelectedVariantTitle(variantTitle)
      setSelectedVariantMedia(initialMedia)
      setProductMedia(currentProductMedia || [])
      setIsOpen("variant-media-modal", true)
    },
    []
  )

  const handleCloseModal = () => {
    setIsOpen("variant-media-modal", false)
    setSelectedVariantIndex(null)
    setSelectedVariantTitle(undefined)
    setSelectedVariantMedia(undefined)
    setProductMedia([])
  }

  const handleSaveMedia = useCallback((variantIndex: number, media: MediaItem[]) => {
    if (saveVariantMediaRef.current) {
      saveVariantMediaRef.current(variantIndex, media)
    }
    handleCloseModal()
  }, [])

  return (
    <>
      <ProductCreateForm
        defaultChannel={defaultChannel}
        store={store}
        onOpenMediaModal={handleOpenMediaModal}
        onSaveVariantMediaRef={saveVariantMediaRef}
      />
      <StackedFocusModal
        id="variant-media-modal"
        onOpenChangeCallback={(open) => {
          if (!open) {
            handleCloseModal()
          }
        }}
      >
        {selectedVariantIndex !== null && (
          <VariantMediaView
            variantIndex={selectedVariantIndex}
            variantTitle={selectedVariantTitle}
            onClose={handleCloseModal}
            onSaveMedia={handleSaveMedia}
            initialMedia={selectedVariantMedia}
            productMedia={productMedia}
          />
        )}
      </StackedFocusModal>
    </>
  )
}

const Root = ({ children }: { children?: ReactNode }) => {
  const { t } = useTranslation()

  const { store, isPending: isStorePending } = useStore()
  const { sales_channels, isPending: isSalesChannelPending } =
    useSalesChannels()

  const ready =
    !!store && !isStorePending && !!sales_channels && !isSalesChannelPending

  const defaultChannel = sales_channels?.[0] as
    | HttpTypes.AdminSalesChannel
    | undefined

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("products.create.title")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t("products.create.description")}</span>
      </RouteFocusModal.Description>
      {ready && (
        Children.count(children) > 0 ? (
          children
        ) : (
          <ProductCreateFormWithModal defaultChannel={defaultChannel} store={store} />
        )
      )}
    </RouteFocusModal>
  )
}

export const ProductCreatePage = Object.assign(Root, {
  DetailsForm: ProductCreateDetailsForm,
  OrganizeForm: ProductCreateOrganizeForm,
  VariantsForm: ProductCreateVariantsForm,
  InventoryKitForm: ProductCreateInventoryKitForm,
  Form: ProductCreateForm,
  Tab: TabbedForm.Tab,
})
