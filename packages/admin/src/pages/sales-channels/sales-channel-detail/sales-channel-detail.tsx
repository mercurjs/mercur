import { Children, ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { useSalesChannel } from "../../../hooks/api/sales-channels"
import { SalesChannelGeneralSection } from "./components/sales-channel-general-section"
import { SalesChannelProductSection } from "./components/sales-channel-product-section"
import { salesChannelLoader } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
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
    <SingleColumnPage showJSON showMetadata data={sales_channel}>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <SalesChannelGeneralSection salesChannel={sales_channel} />
          <SalesChannelProductSection salesChannel={sales_channel} />
        </>
      )}
    </SingleColumnPage>
  )
}

export const SalesChannelDetail = Object.assign(Root, {
  GeneralSection: SalesChannelGeneralSection,
  ProductSection: SalesChannelProductSection,
})
