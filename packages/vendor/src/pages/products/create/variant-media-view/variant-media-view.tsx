import { useRef, useState } from "react"

import { Button } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { StackedFocusModal } from "@components/modals"
import { EditVariantMediaForm } from "../edit-variant-media-form/edit-variant-media-form"
import { VariantMediaGallery } from "./components/variant-media-gallery/variant-media-gallery"
import { VariantMediaViewContext } from "./variant-media-view-context"

type MediaItem = {
  file?: File
  url?: string
  isThumbnail?: boolean
  id?: string
}

type VariantMediaViewProps = {
  variantIndex: number
  variantTitle?: string
  onClose?: () => void
  onSaveMedia?: (variantIndex: number, media: MediaItem[]) => void
  initialMedia?: MediaItem[]
  productMedia: MediaItem[]
}

enum View {
  GALLERY = "gallery",
  EDIT = "edit",
}

const getView = (currentView: string | undefined) => {
  if (currentView === View.EDIT) return View.EDIT
  return View.GALLERY
}

export const VariantMediaView = ({
  variantIndex,
  variantTitle,
  onClose,
  onSaveMedia,
  initialMedia,
  productMedia,
}: VariantMediaViewProps) => {
  const [currentView, setCurrentView] = useState<string | undefined>(View.EDIT)
  const view = getView(currentView)
  const { t } = useTranslation()
  const saveRef = useRef<(() => void) | null>(null)

  const handleGoToView = (v: View) => () => setCurrentView(v)

  const contextValue = {
    goToGallery: handleGoToView(View.GALLERY),
    goToEdit: handleGoToView(View.EDIT),
    onCancel: onClose,
    onClose,
  }

  const handleFooterSave = () => {
    saveRef.current?.()
  }

  return (
    <VariantMediaViewContext.Provider value={contextValue}>
      <StackedFocusModal.Content>
        <StackedFocusModal.Header>
          {view === View.EDIT ? (
            <Button variant="secondary" size="small" onClick={contextValue.goToGallery}>
              {t("products.media.galleryLabel", "Gallery")}
            </Button>
          ) : (
            <Button variant="secondary" size="small" onClick={contextValue.goToEdit}>
              {t("products.media.editLabel", "Edit")}
            </Button>
          )}
        </StackedFocusModal.Header>
        <StackedFocusModal.Body className="flex flex-col overflow-hidden">
          {view === View.GALLERY && (
            <VariantMediaGallery goToEdit={contextValue.goToEdit} variantMedia={initialMedia} />
          )}
          {view === View.EDIT && (
            <EditVariantMediaForm
              variantIndex={variantIndex}
              variantTitle={variantTitle}
              onSaveMedia={onSaveMedia}
              onClose={onClose}
              saveRef={saveRef}
              initialMedia={initialMedia}
              productMedia={productMedia}
            />
          )}
        </StackedFocusModal.Body>
        {view === View.EDIT && (
          <StackedFocusModal.Footer>
            <div className="flex justify-end gap-x-2">
              <Button variant="secondary" size="small" onClick={onClose}>
                {t("actions.cancel")}
              </Button>
              <Button size="small" onClick={handleFooterSave}>
                {t("actions.save")}
              </Button>
            </div>
          </StackedFocusModal.Footer>
        )}
      </StackedFocusModal.Content>
    </VariantMediaViewContext.Provider>
  )
}
