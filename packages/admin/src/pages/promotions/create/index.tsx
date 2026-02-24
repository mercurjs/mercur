import { RouteFocusModal } from "@components/modals"

import { CreatePromotionForm } from "../promotion-create/components/create-promotion-form/create-promotion-form"

const PromotionCreate = () => {
  return (
    <RouteFocusModal>
      <CreatePromotionForm />
    </RouteFocusModal>
  )
}

export const Component = PromotionCreate
