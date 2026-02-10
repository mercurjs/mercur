// Route: /categories/organize
import { RouteFocusModal } from "@components/modals"
import { OrganizeCategoryForm } from "../[id]/organize/organize-category-form"

export const Component = () => {
  return (
    <RouteFocusModal>
      <OrganizeCategoryForm />
    </RouteFocusModal>
  )
}
