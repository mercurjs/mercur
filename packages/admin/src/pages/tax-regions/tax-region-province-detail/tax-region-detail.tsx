import { Children, ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPage } from "../../../components/layout/pages"
import { useTaxRegion } from "../../../hooks/api/tax-regions"
import { TaxRegionProvinceDetailSection } from "./components/tax-region-province-detail-section"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { TaxRegionProvinceOverrideSection } from "./components/tax-region-province-override-section"
import { taxRegionLoader } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
  const { province_id } = useParams()

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof taxRegionLoader>
  >

  const {
    tax_region: taxRegion,
    isLoading,
    isError,
    error,
  } = useTaxRegion(province_id!, undefined, { initialData })

  if (isLoading || !taxRegion) {
    return <SingleColumnPageSkeleton sections={2} showJSON />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage data={taxRegion} showJSON>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <TaxRegionProvinceDetailSection taxRegion={taxRegion} />
          <TaxRegionProvinceOverrideSection taxRegion={taxRegion} />
        </>
      )}
    </SingleColumnPage>
  )
}

export const TaxRegionDetail = Object.assign(Root, {
  DetailSection: TaxRegionProvinceDetailSection,
  OverrideSection: TaxRegionProvinceOverrideSection,
})
