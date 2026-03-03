import { Children, ReactNode } from "react"
import { useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { usePayout } from "../../../hooks/api/payouts"
import { PayoutGeneralSection } from "./components/payout-general-section"

const Root = ({ children }: { children?: ReactNode }) => {
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
      {Children.count(children) > 0 ? (
        children
      ) : (
        <PayoutGeneralSection payout={payout} />
      )}
    </SingleColumnPage>
  )
}

export const PayoutDetail = Object.assign(Root, {
  GeneralSection: PayoutGeneralSection,
})
