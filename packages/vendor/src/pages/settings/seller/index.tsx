import { useLoaderData } from "react-router-dom"

import { useStore } from "@hooks/api/store"
import { SellerGeneralSection } from "./_components/seller-general-section"
import { sellerLoader } from "./loader"

import { SingleColumnPageSkeleton } from "@components/common/skeleton"
import { SingleColumnPage } from "@components/layout/pages"
import { useDashboardExtension } from "@/extensions"

const SellerDetail = () => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof sellerLoader>>

  const { store, isPending, isError, error } = useStore(undefined, {
    initialData,
  })

  const { getWidgets } = useDashboardExtension()

  if (isPending || !store) {
    return <SingleColumnPageSkeleton sections={1} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("seller.details.before"),
        after: getWidgets("seller.details.after"),
      }}
      data={store}
      hasOutlet
      showMetadata
      showJSON
    >
      <SellerGeneralSection seller={store} />
    </SingleColumnPage>
  )
}

export const Component = SellerDetail
export { sellerLoader as loader } from "./loader"
