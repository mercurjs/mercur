import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPage } from "@components/layout/pages"
import { SingleColumnPageSkeleton } from "@components/common/skeleton"
import { useTaxRegion } from "@hooks/api/tax-regions"
import { useExtension } from "@providers/extension-provider"

import { TaxRegionProvinceDetailSection } from "@pages/settings/tax-regions/tax-region-province-detail/components/tax-region-province-detail-section"
import { TaxRegionProvinceOverrideSection } from "@pages/settings/tax-regions/tax-region-province-detail/components/tax-region-province-override-section"
import { taxRegionProvinceLoader } from "./loader"

export { taxRegionProvinceLoader as loader } from "./loader"
export { TaxRegionProvinceBreadcrumb as Breadcrumb } from "./breadcrumb"

const TaxRegionProvinceDetail = () => {
  const { province_id } = useParams()

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof taxRegionProvinceLoader>
  >

  const {
    tax_region: taxRegion,
    isLoading,
    isError,
    error,
  } = useTaxRegion(province_id!, undefined, { initialData })

  const { getWidgets } = useExtension()

  if (isLoading || !taxRegion) {
    return <SingleColumnPageSkeleton sections={2} showJSON />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage
      data={taxRegion}
      showJSON
      widgets={{
        after: getWidgets("tax.details.after"),
        before: getWidgets("tax.details.before"),
      }}
    >
      <TaxRegionProvinceDetailSection taxRegion={taxRegion} />
      <TaxRegionProvinceOverrideSection taxRegion={taxRegion} />
    </SingleColumnPage>
  )
}

export const Component = TaxRegionProvinceDetail
