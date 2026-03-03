import { ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import { useSalesChannel } from "../../../hooks/api/sales-channels"
import { SalesChannelGeneralSection } from "./components/sales-channel-general-section"
import { SalesChannelProductSection } from "./components/sales-channel-product-section"
import { salesChannelLoader } from "./loader"

const ALLOWED_TYPES = [SalesChannelGeneralSection, SalesChannelProductSection] as const

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

  return hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? (
    <SingleColumnPage showJSON showMetadata data={sales_channel}>
      {children}
    </SingleColumnPage>
  ) : (
    <SingleColumnPage showJSON showMetadata data={sales_channel}>
      <SalesChannelGeneralSection salesChannel={sales_channel} />
      <SalesChannelProductSection salesChannel={sales_channel} />
    </SingleColumnPage>
  )
}

export const SalesChannelDetailPage = Object.assign(Root, {
  GeneralSection: SalesChannelGeneralSection,
  ProductSection: SalesChannelProductSection,
})
