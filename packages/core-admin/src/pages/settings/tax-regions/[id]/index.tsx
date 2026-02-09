import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPage } from "@components/layout/pages"
import { SingleColumnPageSkeleton } from "@components/common/skeleton"
import { useTaxRegion } from "@hooks/api/tax-regions"
import { useExtension } from "@providers/extension-provider"

import { TaxRegionDetailSection } from "@pages/settings/tax-regions/tax-region-detail/components/tax-region-detail-section"
import { TaxRegionProvinceSection } from "@pages/settings/tax-regions/tax-region-detail/components/tax-region-province-section"
import { TaxRegionOverrideSection } from "@pages/settings/tax-regions/tax-region-detail/components/tax-region-override-section"
import { TaxRegionSublevelAlert } from "@pages/settings/tax-regions/tax-region-detail/components/tax-region-sublevel-alert"
import { TaxRegionProviderSection } from "@pages/settings/tax-regions/tax-region-detail/tax-region-provider-section"
import { taxRegionLoader } from "./loader"
import { useState } from "react"

export { taxRegionLoader as loader } from "./loader"
export { TaxRegionDetailBreadcrumb as Breadcrumb } from "./breadcrumb"

const TaxRegionDetail = () => {
  const { id } = useParams()
  const [showSublevelRegions, setShowSublevelRegions] = useState(false)

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof taxRegionLoader>
  >

  const {
    tax_region: taxRegion,
    isLoading,
    isError,
    error,
  } = useTaxRegion(id!, undefined, { initialData })

  const { getWidgets } = useExtension()

  if (isLoading || !taxRegion) {
    return <SingleColumnPageSkeleton sections={4} showJSON />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage
      data={taxRegion}
      showJSON
      showMetadata
      widgets={{
        after: getWidgets("tax.details.after"),
        before: getWidgets("tax.details.before"),
      }}
    >
      <TaxRegionSublevelAlert
        taxRegion={taxRegion}
        showSublevelRegions={showSublevelRegions}
        setShowSublevelRegions={setShowSublevelRegions}
      />
      <TaxRegionDetailSection taxRegion={taxRegion} />
      <TaxRegionProvinceSection
        taxRegion={taxRegion}
        showSublevelRegions={showSublevelRegions}
      />
      <TaxRegionOverrideSection taxRegion={taxRegion} />
      <TaxRegionProviderSection taxRegion={taxRegion} />
    </SingleColumnPage>
  )
}

export const Component = TaxRegionDetail
