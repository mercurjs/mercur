import { useLoaderData } from "react-router-dom"

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk"
import {
  LayoutComposer,
  detailPageDefaultEntries,
} from "@mercurjs/dashboard-shared"
import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { useStore } from "../../../hooks/api/store"
import { MarketplaceCurrencySection } from "./components/marketplace-currency-section"
import { MarketplaceGeneralSection } from "./components/marketplace-general-section"
import { storeLoader } from "./loader"

export const MarketplaceDetailPage = () => {
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
    <LayoutComposer
      widgetsZonePrefix="marketplace.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
      data={store}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="MarketplaceGeneralSection">
              <MarketplaceGeneralSection store={store} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="MarketplaceCurrencySection">
              <MarketplaceCurrencySection store={store} />
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(store)}
          </>
        ),
      }}
    />
  )
}
