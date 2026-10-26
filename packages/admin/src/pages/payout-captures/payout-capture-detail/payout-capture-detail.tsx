import { Children, ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { WidgetZone } from "@mercurjs/dashboard-shared"
import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { usePayoutCapture } from "../../../hooks/api/payout-captures"
import { PayoutCaptureGeneralSection } from "./components/payout-capture-general-section"
import { PayoutCaptureOrdersSection } from "./components/payout-capture-orders-section"
import { PayoutCapturePaymentSection } from "./components/payout-capture-payment-section"
import { payoutCaptureLoader } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams()

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof payoutCaptureLoader>
  >

  const { capture, isLoading, isError, error } = usePayoutCapture(id!, {
    initialData,
  })

  if (isLoading || !capture) {
    return (
      <TwoColumnPageSkeleton mainSections={2} sidebarSections={1} showJSON />
    )
  }

  if (isError) {
    throw error
  }

  return Children.count(children) > 0 ? (
    <TwoColumnPage data={capture} showJSON>
      {children}
    </TwoColumnPage>
  ) : (
    <TwoColumnPage data={capture} showJSON>
      <TwoColumnPage.Main>
        <WidgetZone id="payout_captures.detail.main" data={capture}>
          <PayoutCaptureGeneralSection capture={capture} />
          <PayoutCaptureOrdersSection capture={capture} />
        </WidgetZone>
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <WidgetZone id="payout_captures.detail.side" data={capture}>
          <PayoutCapturePaymentSection capture={capture} />
        </WidgetZone>
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}

export const PayoutCaptureDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: PayoutCaptureGeneralSection,
  MainOrdersSection: PayoutCaptureOrdersSection,
  SidebarPaymentSection: PayoutCapturePaymentSection,
})
