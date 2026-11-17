import { useLoaderData, useParams } from "react-router-dom"

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk"
import {
  LayoutComposer,
  detailPageDefaultEntries,
} from "@mercurjs/dashboard-shared"
import { useTaxRegion } from "../../../hooks/api/tax-regions"
import { TaxRegionProvinceDetailSection } from "./components/tax-region-province-detail-section"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { TaxRegionProvinceOverrideSection } from "./components/tax-region-province-override-section"
import { taxRegionLoader } from "./loader"

export const TaxRegionProvinceDetailPage = () => {
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
    <LayoutComposer
      widgetsZonePrefix="tax-regions.province.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
      data={taxRegion}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="TaxRegionProvinceDetailSection">
              <TaxRegionProvinceDetailSection taxRegion={taxRegion} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="TaxRegionProvinceOverrideSection">
              <TaxRegionProvinceOverrideSection taxRegion={taxRegion} />
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(taxRegion, { metadata: false })}
          </>
        ),
      }}
    />
  )
}
