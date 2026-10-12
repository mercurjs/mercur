import { RouteFocusModal } from "@mercurjs/dashboard-shared"

import { OfferConditionCreateForm } from "./components/offer-condition-create-form"

export const OfferConditionCreate = () => {
  return (
    <RouteFocusModal data-testid="offer-condition-create-modal">
      <OfferConditionCreateForm />
    </RouteFocusModal>
  )
}
