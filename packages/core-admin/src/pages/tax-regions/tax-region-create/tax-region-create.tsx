import { RouteFocusModal } from "../../../components/modals"
import { TaxRegionCreateForm } from "./components/tax-region-create-form"

export const TaxRegionCreate = () => {
  return (
    <RouteFocusModal data-testid="tax-region-create-modal">
      <TaxRegionCreateForm />
    </RouteFocusModal>
  )
}
