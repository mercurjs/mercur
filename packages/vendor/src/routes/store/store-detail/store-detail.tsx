import { useLoaderData } from "react-router-dom"

import { useStore } from "../../../hooks/api/store"
import { StoreGeneralSection } from "./components/store-general-section"
import { storeLoader } from "./loader"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"

import { StoreCurrencySection } from "./components/store-currency-section"

export const StoreDetail = () => {
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
      <StoreGeneralSection store={store} />
      <StoreCurrencySection store={store} />
    </SingleColumnPage>
  )
}
