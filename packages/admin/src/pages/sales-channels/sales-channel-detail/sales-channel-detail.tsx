import { useLoaderData, useParams } from "react-router-dom"

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk"
import {
  LayoutComposer,
  PermissionGuard,
  detailPageDefaultEntries,
} from "@mercurjs/dashboard-shared"
import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { useSalesChannel } from "../../../hooks/api/sales-channels"
import { SalesChannelGeneralSection } from "./components/sales-channel-general-section"
import { SalesChannelProductSection } from "./components/sales-channel-product-section"
import { salesChannelLoader } from "./loader"

export const SalesChannelDetailPage = () => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof salesChannelLoader>
  >

  const { id } = useParams()
  const { sales_channel, isPending: isLoading } = useSalesChannel(id!, {
    initialData,
  })

  if (isLoading || !sales_channel) {
    return <SingleColumnPageSkeleton sections={2} showJSON showMetadata />
  }

  return (
    <LayoutComposer
      widgetsZonePrefix="sales-channels.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
      data={sales_channel}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="SalesChannelGeneralSection">
              <SalesChannelGeneralSection salesChannel={sales_channel} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="SalesChannelProductSection">
              <PermissionGuard permission="products:view">
                <SalesChannelProductSection salesChannel={sales_channel} />
              </PermissionGuard>
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(sales_channel)}
          </>
        ),
      }}
    />
  )
}
