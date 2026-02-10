// Route: /promotions/create
import { RouteFocusModal } from "@components/modals"
import { CreatePromotionForm } from "./create-promotion-form/create-promotion-form"

export const Component = () => {
  return (
    <RouteFocusModal>
      <CreatePromotionForm />
    </RouteFocusModal>
  )
}
