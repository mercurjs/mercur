import { Children, ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { usePricePreferences } from "../../../hooks/api/price-preferences"
import { useRegion } from "../../../hooks/api/regions"
import { RegionCountrySection } from "./components/region-country-section"
import { RegionGeneralSection } from "./components/region-general-section"
import { regionLoader } from "./loader"
import { REGION_DETAIL_FIELDS } from "./constants"

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof regionLoader>
  >

  const { id } = useParams()
  const {
    region,
    isPending: isLoading,
    isError: isRegionError,
    error: regionError,
  } = useRegion(
    id!,
    { fields: REGION_DETAIL_FIELDS },
    {
      initialData,
    }
  )

  const {
    price_preferences: pricePreferences,
    isPending: isLoadingPreferences,
    isError: isPreferencesError,
    error: preferencesError,
  } = usePricePreferences(
    {
      attribute: "region_id",
      value: id,
    },
    { enabled: !!region }
  )

  if (isLoading || isLoadingPreferences || !region) {
    return <SingleColumnPageSkeleton sections={2} showJSON showMetadata />
  }

  if (isRegionError) {
    throw regionError
  }

  if (isPreferencesError) {
    throw preferencesError
  }

  return (
    <SingleColumnPage data={region} showMetadata showJSON>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <RegionGeneralSection
            region={region}
            pricePreferences={pricePreferences ?? []}
          />
          <RegionCountrySection region={region} />
        </>
      )}
    </SingleColumnPage>
  )
}

export const RegionDetail = Object.assign(Root, {
  GeneralSection: RegionGeneralSection,
  CountrySection: RegionCountrySection,
})
