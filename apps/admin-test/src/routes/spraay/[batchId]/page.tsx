import { Children, ReactNode } from "react"

import type { RouteHandle } from "@mercurjs/dashboard-sdk"
import { TwoColumnPage, TwoColumnPageSkeleton } from "@mercurjs/dashboard-shared"
import { useParams, type UIMatch } from "react-router-dom"

import { SpraayPreflightSection } from "../../../components/spraay/preflight-section"
import { useSpraayBatch, type SpraayBatch } from "../../../lib/spraay/api"
import { shortHex } from "../../../lib/spraay/format"
import { BatchGeneralSection } from "./components/batch-general-section"
import { BatchItemsSection } from "./components/batch-items-section"
import { BatchTimelineSection } from "./components/batch-timeline-section"
import { BatchTransactionSection } from "./components/batch-transaction-section"

const IN_FLIGHT = new Set(["broadcasting", "confirming"])
const NEEDS_FUNDS = new Set(["assembling", "awaiting_signature"])

export const handle: RouteHandle = {
  permissions: "payouts:view",
  breadcrumb: (match: UIMatch) => shortHex(match.params.batchId, 8),
}

const BatchMain = ({ batch }: { batch: SpraayBatch }) => (
  <TwoColumnPage.Main>
    <BatchGeneralSection batch={batch} />
    <BatchTransactionSection batch={batch} />
    <BatchItemsSection batch={batch} />
  </TwoColumnPage.Main>
)

const BatchSidebar = ({ batch }: { batch: SpraayBatch }) => (
  <TwoColumnPage.Sidebar>
    <BatchTimelineSection batch={batch} />
    {NEEDS_FUNDS.has(batch.status) && <SpraayPreflightSection />}
  </TwoColumnPage.Sidebar>
)

const Root = ({ children }: { children?: ReactNode }) => {
  const { batchId } = useParams()
  const { batch, isLoading, isError, error } = useSpraayBatch(batchId!, {
    refetchInterval: (query) => (IN_FLIGHT.has(query.state.data?.batch.status ?? "") ? 15_000 : false),
  })

  if (isError) {
    throw error
  }

  if (isLoading || !batch) {
    return <TwoColumnPageSkeleton mainSections={3} sidebarSections={2} showJSON showMetadata={false} />
  }

  return (
    <TwoColumnPage data={batch} showJSON>
      {Children.count(children) > 0
        ? children
        : [<BatchMain key="main" batch={batch} />, <BatchSidebar key="sidebar" batch={batch} />]}
    </TwoColumnPage>
  )
}

const SpraayBatchDetailPage = Object.assign(Root, {
  Main: BatchMain,
  Sidebar: BatchSidebar,
  GeneralSection: BatchGeneralSection,
  TransactionSection: BatchTransactionSection,
  ItemsSection: BatchItemsSection,
  TimelineSection: BatchTimelineSection,
})

export default SpraayBatchDetailPage
