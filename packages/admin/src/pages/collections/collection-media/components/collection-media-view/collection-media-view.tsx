import { HttpTypes } from "@medusajs/types"
import { useMemo } from "react"
import { useSearchParams } from "react-router-dom"

import { CollectionWithImages } from "../../../common/components/collection-image-fields"
import { EditCollectionMediaForm } from "../edit-collection-media-form"
import { CollectionMediaGallery } from "../collection-media-gallery"
import { CollectionMediaViewContext } from "./collection-media-view-context"

type CollectionMediaViewProps = {
  collection: HttpTypes.AdminCollection & CollectionWithImages
}

enum View {
  GALLERY = "gallery",
  EDIT = "edit",
}

const getView = (searchParams: URLSearchParams) => {
  const view = searchParams.get("view")
  if (view === View.EDIT) {
    return View.EDIT
  }

  return View.GALLERY
}

export const CollectionMediaView = ({
  collection,
}: CollectionMediaViewProps) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const view = getView(searchParams)

  const contextValue = useMemo(
    () => ({
      goToGallery: () => setSearchParams({ view: View.GALLERY }),
      goToEdit: () => setSearchParams({ view: View.EDIT }),
    }),
    [setSearchParams]
  )

  return (
    <CollectionMediaViewContext.Provider value={contextValue}>
      {view === View.EDIT ? (
        <EditCollectionMediaForm collection={collection} />
      ) : (
        <CollectionMediaGallery collection={collection} />
      )}
    </CollectionMediaViewContext.Provider>
  )
}
