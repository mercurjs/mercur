import { Children, ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"
import { useState } from "react"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { useTaxRegion } from "../../../hooks/api/tax-regions"
import { TaxRegionDetailSection } from "./components/tax-region-detail-section"
import { TaxRegionProvinceSection } from "./components/tax-region-province-section"
import { TaxRegionOverrideSection } from "./components/tax-region-override-section"
import { TaxRegionSublevelAlert } from "./components/tax-region-sublevel-alert"
import { TaxRegionProviderSection } from "./tax-region-provider-section"
import { taxRegionLoader } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
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

  if (isLoading || !taxRegion) {
    return <SingleColumnPageSkeleton sections={4} showJSON />
  }

  if (isError) {
    throw error
  }

  return (
    <>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <SingleColumnPage data={taxRegion} showJSON showMetadata>
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
      )}
    </>
  )
}

export const TaxRegionDetail = Object.assign(Root, {
  SublevelAlert: TaxRegionSublevelAlert,
  DetailSection: TaxRegionDetailSection,
  ProvinceSection: TaxRegionProvinceSection,
  OverrideSection: TaxRegionOverrideSection,
  ProviderSection: TaxRegionProviderSection,
})
