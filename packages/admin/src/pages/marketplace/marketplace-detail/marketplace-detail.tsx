import { useLoaderData } from "react-router-dom"

import { useStore } from "../../../hooks/api/store"
import { MarketplaceGeneralSection } from "./components/marketplace-general-section"
import { storeLoader } from "./loader"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { MarketplaceCurrencySection } from "./components/marketplace-currency-section"

export const MarketplaceDetail = () => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof storeLoader>>

  const { store, isPending, isError, error } = useStore(undefined, {
    initialData,
  })

  if (isPending || !store) {
    return <SingleColumnPageSkeleton sections={2} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage
      data={store}
      hasOutlet
      showMetadata
      showJSON
    >
      <MarketplaceGeneralSection store={store} />
      <MarketplaceCurrencySection store={store} />
    </SingleColumnPage>
  )
}
