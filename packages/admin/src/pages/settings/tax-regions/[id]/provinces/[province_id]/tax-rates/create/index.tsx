import { useParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"
import { useTaxRegion } from "@hooks/api/tax-regions"
import { TaxRegionTaxRateCreateForm } from "@pages/settings/tax-regions/tax-region-tax-rate-create/components/tax-region-tax-rate-create-form"

const TaxRegionProvinceTaxRateCreate = () => {
  const { id, province_id } = useParams()

  const { tax_region, isPending, isError, error } = useTaxRegion(
    province_id || id!
  )

  const ready = !isPending && !!tax_region

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal>
      {ready && (
        <TaxRegionTaxRateCreateForm
          taxRegion={tax_region}
          isSublevel={!!province_id}
        />
      )}
    </RouteFocusModal>
  )
}

export const Component = TaxRegionProvinceTaxRateCreate
