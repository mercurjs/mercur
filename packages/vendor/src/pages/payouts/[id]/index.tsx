// Route: /payouts/:id
import { useParams, LoaderFunctionArgs } from "react-router-dom"

import { SingleColumnPageSkeleton } from "@components/common/skeleton"
import { SingleColumnPage } from "@components/layout/pages"
import { usePayout, payoutsQueryKeys } from "@hooks/api/payouts"
import { fetchQuery } from "@lib/client"
import { queryClient } from "@lib/query-client"

import { PayoutGeneralSection } from "./_components/payout-general-section"

const payoutDetailQuery = (id: string) => ({
  queryKey: payoutsQueryKeys.detail(id),
  queryFn: async () =>
    fetchQuery(`/vendor/payouts/${id}`, {
      method: "GET",
    }),
})

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = payoutDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}

export const Breadcrumb = () => {
  return <span>Payout</span>
}

export const Component = () => {
  const { id } = useParams()

  const { payout, isLoading, isError, error } = usePayout(id!)

  if (isLoading || !payout) {
    return <SingleColumnPageSkeleton sections={1} />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage data={payout} hasOutlet={false} showJSON showMetadata>
      <PayoutGeneralSection payout={payout} />
    </SingleColumnPage>
  )
}
