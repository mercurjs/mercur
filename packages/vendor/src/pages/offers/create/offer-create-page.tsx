import { RouteFocusModal } from "../../../components/modals"
import { CreateOfferForm } from "./create-offer-form"

export const OfferCreatePage = () => (
  <RouteFocusModal>
    <RouteFocusModal.Title asChild>
      <span className="sr-only">Create offer</span>
    </RouteFocusModal.Title>
    <RouteFocusModal.Description asChild>
      <span className="sr-only">
        Select variants and configure stock levels and prices to create offers.
      </span>
    </RouteFocusModal.Description>
    <CreateOfferForm />
  </RouteFocusModal>
)

export const Component = OfferCreatePage
