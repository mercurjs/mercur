// Route: /categories/:id/organize
import { RouteFocusModal } from "@components/modals"
import { OrganizeCategoryForm } from "./organize-category-form"

export const Component = () => {
  return (
    <RouteFocusModal>
      <OrganizeCategoryForm />
    </RouteFocusModal>
  )
}
