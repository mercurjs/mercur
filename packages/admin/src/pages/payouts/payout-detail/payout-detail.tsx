import { ReactNode } from "react"
import { useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import { usePayout } from "../../../hooks/api/payouts"
import { PayoutGeneralSection } from "./components/payout-general-section"

const ALLOWED_TYPES = [PayoutGeneralSection] as const

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams()

  const { payout, isLoading, isError, error } = usePayout(id!)

  if (isLoading || !payout) {
    return <SingleColumnPageSkeleton sections={1} />
  }

  if (isError) {
    throw error
  }

  return hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? (
    <SingleColumnPage data={payout} showJSON showMetadata>
      {children}
    </SingleColumnPage>
  ) : (
    <SingleColumnPage data={payout} showJSON showMetadata>
      <PayoutGeneralSection payout={payout} />
    </SingleColumnPage>
  )
}

export const PayoutDetailPage = Object.assign(Root, {
  GeneralSection: PayoutGeneralSection,
})
