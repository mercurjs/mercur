import { RouteFocusModal } from "@components/modals"
import { TaxRegionCreateForm } from "@pages/tax-regions/tax-region-create/components/tax-region-create-form"

export const TaxRegionCreate = () => {
  return (
    <RouteFocusModal data-testid="tax-region-create-modal">
      <TaxRegionCreateForm />
    </RouteFocusModal>
  )
}
