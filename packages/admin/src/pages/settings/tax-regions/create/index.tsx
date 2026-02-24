import { RouteFocusModal } from "@components/modals"
import { TaxRegionCreateForm } from "./_components/tax-region-create-form"

const TaxRegionCreate = () => {
  return (
    <RouteFocusModal>
      <TaxRegionCreateForm />
    </RouteFocusModal>
  )
}

export const Component = TaxRegionCreate
