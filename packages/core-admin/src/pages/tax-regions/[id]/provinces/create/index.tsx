import { useParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"
import { useTaxRegion } from "@hooks/api/tax-regions"
import { TaxRegionProvinceCreateForm } from "@pages/tax-regions/tax-region-province-create/components/tax-region-province-create-form"

const TaxProvinceCreate = () => {
  const { id } = useParams()

  const { tax_region, isPending, isError, error } = useTaxRegion(id!)

  const ready = !isPending && !!tax_region

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal data-testid="tax-region-province-create-modal">
      {ready && <TaxRegionProvinceCreateForm parent={tax_region} />}
    </RouteFocusModal>
  )
}

export const Component = TaxProvinceCreate
