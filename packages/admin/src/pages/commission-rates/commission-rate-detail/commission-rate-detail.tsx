import { Children, ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { useCommissionRate } from "../../../hooks/api/commission-rates"
import { CommissionRateGeneralSection } from "./components/commission-rate-general-section"
import { CommissionRateRulesSection } from "./components/commission-rate-rules-section"
import { commissionRateLoader } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof commissionRateLoader>
  >

  const { id } = useParams()
  const {
    commission_rate,
    isPending: isLoading,
    isError,
    error,
  } = useCommissionRate(id!, { fields: "*rules" }, { initialData })

  if (isLoading || !commission_rate) {
    return <SingleColumnPageSkeleton sections={2} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage data={commission_rate} showJSON showMetadata>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <CommissionRateGeneralSection commissionRate={commission_rate} />
          <CommissionRateRulesSection commissionRate={commission_rate} />
        </>
      )}
    </SingleColumnPage>
  )
}

export const CommissionRateDetail = Object.assign(Root, {
  GeneralSection: CommissionRateGeneralSection,
  RulesSection: CommissionRateRulesSection,
})
