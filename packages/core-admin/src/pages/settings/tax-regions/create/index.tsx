import { RouteFocusModal } from "@components/modals"

import { TaxRegionCreateForm } from "@pages/settings/tax-regions/tax-region-create/components/tax-region-create-form"

const TaxRegionCreate = () => {
  return (
    <RouteFocusModal data-testid="tax-region-create-modal">
      <TaxRegionCreateForm />
    </RouteFocusModal>
  )
}

export const Component = TaxRegionCreate
