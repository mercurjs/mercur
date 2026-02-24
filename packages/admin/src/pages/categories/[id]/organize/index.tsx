// Route: /categories/:id/organize

import { RouteFocusModal } from "@components/modals"
import { OrganizeCategoryForm } from "./_components/organize-category-form"

export const Component = () => {
  return (
    <RouteFocusModal>
      <OrganizeCategoryForm />
    </RouteFocusModal>
  )
}
