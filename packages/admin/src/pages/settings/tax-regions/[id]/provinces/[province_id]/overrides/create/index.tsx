import { useParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"
import { useTaxRegion } from "@hooks/api/tax-regions"
import { TaxRegionCreateTaxOverrideForm } from "@pages/settings/tax-regions/tax-region-tax-override-create/components/tax-region-override-create-form"

const TaxRegionProvinceCreateTaxOverride = () => {
  const { id, province_id } = useParams()

  const { tax_region, isPending, isError, error } = useTaxRegion(
    province_id || id!
  )

  const ready = !isPending && !!tax_region

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal data-testid="tax-region-override-create-modal">
      {ready && <TaxRegionCreateTaxOverrideForm taxRegion={tax_region} />}
    </RouteFocusModal>
  )
}

export const Component = TaxRegionProvinceCreateTaxOverride
