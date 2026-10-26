import { Children, ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { WidgetZone } from "@mercurjs/dashboard-shared"
import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { useTransfer } from "../../../hooks/api/transfers"
import { TransferGeneralSection } from "./components/transfer-general-section"
import { TransferReferencesSection } from "./components/transfer-references-section"
import { TransferStatusAlert } from "./components/transfer-status-alert"
import { transferLoader } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams()

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof transferLoader>
  >

  const { transfer, isLoading, isError, error } = useTransfer(id!, undefined, {
    initialData,
  })

  if (isLoading || !transfer) {
    return (
      <TwoColumnPageSkeleton mainSections={1} sidebarSections={1} showJSON />
    )
  }

  if (isError) {
    throw error
  }

  return Children.count(children) > 0 ? (
    <TwoColumnPage data={transfer} showJSON>
      {children}
    </TwoColumnPage>
  ) : (
    <TwoColumnPage data={transfer} showJSON>
      <TwoColumnPage.Main>
        <WidgetZone id="transfers.detail.main" data={transfer}>
          <TransferStatusAlert transfer={transfer} />
          <TransferGeneralSection transfer={transfer} />
        </WidgetZone>
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <WidgetZone id="transfers.detail.side" data={transfer}>
          <TransferReferencesSection transfer={transfer} />
        </WidgetZone>
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}

export const TransferDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainStatusAlert: TransferStatusAlert,
  MainGeneralSection: TransferGeneralSection,
  SidebarReferencesSection: TransferReferencesSection,
})
