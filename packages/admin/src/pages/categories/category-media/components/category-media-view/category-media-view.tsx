import { HttpTypes } from "@medusajs/types"
import { useMemo } from "react"
import { useSearchParams } from "react-router-dom"

import { CategoryWithImages } from "../../../common/components/category-image-fields"
import { EditCategoryMediaForm } from "../edit-category-media-form"
import { CategoryMediaGallery } from "../category-media-gallery"
import { CategoryMediaViewContext } from "./category-media-view-context"

type CategoryMediaViewProps = {
  category: HttpTypes.AdminProductCategory & CategoryWithImages
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

export const CategoryMediaView = ({ category }: CategoryMediaViewProps) => {
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
    <CategoryMediaViewContext.Provider value={contextValue}>
      {view === View.EDIT ? (
        <EditCategoryMediaForm category={category} />
      ) : (
        <CategoryMediaGallery category={category} />
      )}
    </CategoryMediaViewContext.Provider>
  )
}
