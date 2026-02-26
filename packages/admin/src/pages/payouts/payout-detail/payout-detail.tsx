import { useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { usePayout } from "../../../hooks/api/payouts"
import { PayoutGeneralSection } from "./components/payout-general-section"

export const PayoutDetail = () => {
  const { id } = useParams()

  const { payout, isLoading, isError, error } = usePayout(id!)

  if (isLoading || !payout) {
    return <SingleColumnPageSkeleton sections={1} />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage data={payout} showJSON showMetadata>
      <PayoutGeneralSection payout={payout} />
    </SingleColumnPage>
  )
}
