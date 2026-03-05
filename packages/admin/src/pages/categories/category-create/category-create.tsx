import { Children, ReactNode } from "react"
import { useSearchParams } from "react-router-dom"

import { RouteFocusModal } from "../../../components/modals"
import { TabbedForm } from "../../../components/tabbed-form/tabbed-form"
import {
  CreateCategoryForm,
  CreateCategorySchemaType,
} from "./components/create-category-form"
import { CreateCategoryDetails } from "./components/create-category-form/create-category-details"
import { CreateCategoryNesting } from "./components/create-category-form/create-category-nesting"
import { CreateCategorySchema } from "./components/create-category-form/schema"

const Root = ({ children }: { children?: ReactNode }) => {
  const [searchParams] = useSearchParams()
  const parentCategoryId = searchParams.get("parent_category_id")

  return (
    <RouteFocusModal>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <CreateCategoryForm parentCategoryId={parentCategoryId} />
      )}
    </RouteFocusModal>
  )
}

export const CategoryCreatePage = Object.assign(Root, {
  Form: CreateCategoryForm,
  DetailsTab: CreateCategoryDetails,
  OrganizeTab: CreateCategoryNesting,
  Tab: TabbedForm.Tab,
})

export type { CreateCategorySchemaType }
export { CreateCategorySchema }

// Keep backward-compatible named export for route `Component`
export const CategoryCreate = Root
