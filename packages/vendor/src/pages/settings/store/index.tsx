import { useStore } from "@hooks/api/store"

import { SingleColumnPageSkeleton } from "@components/common/skeleton"
import { SingleColumnPage } from "@components/layout/pages"
import { StoreGeneralSection } from "./_components/store-general-section"
import { CompanySection } from "./_components/company-section"

const StoreDetail = () => {
  const { store, isPending, isError, error } = useStore()

  if (isPending || !store) {
    return <SingleColumnPageSkeleton sections={2} />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage data={store} hasOutlet>
      <StoreGeneralSection store={store} />
      <CompanySection store={store} />
    </SingleColumnPage>
  )
}

export const Component = StoreDetail
