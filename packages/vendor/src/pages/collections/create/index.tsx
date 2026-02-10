// Route: /collections/create
import { RouteFocusModal } from "@components/modals"
import { CreateCollectionForm } from "./create-collection-form"

export const Component = () => {
  return (
    <RouteFocusModal>
      <CreateCollectionForm />
    </RouteFocusModal>
  )
}
