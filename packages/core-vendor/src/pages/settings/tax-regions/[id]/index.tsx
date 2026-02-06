import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPage } from "@components/layout/pages"
import { useTaxRegion } from "@hooks/api/tax-regions"
import { TaxRegionDetailSection } from "./_components/tax-region-detail-section"
import { TaxRegionProvinceSection } from "./_components/tax-region-province-section"

import { useState } from "react"
import { SingleColumnPageSkeleton } from "@components/common/skeleton"
import { useDashboardExtension } from "@/extensions"
import { TaxRegionOverrideSection } from "./_components/tax-region-override-section"
import { TaxRegionSublevelAlert } from "./_components/tax-region-sublevel-alert"
import { taxRegionLoader } from "./loader"

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

  const { getWidgets } = useDashboardExtension()

  if (isLoading || !taxRegion) {
    return <SingleColumnPageSkeleton sections={4} />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage
      data={taxRegion}
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
    </SingleColumnPage>
  )
}

export const Component = TaxRegionDetail
export { taxRegionLoader as loader } from "./loader"
export { TaxRegionDetailBreadcrumb as Breadcrumb } from "./breadcrumb"
